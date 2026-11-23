import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CANVAS_HEIGHT, CANVAS_WIDTH, RENDERER, type Stroke } from "../../src/drawing/stroke.ts";
import { createApp, type RedrawApi } from "../app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => { await database.db.dropDatabase(); });
afterAll(async () => { await database.close(); });

const stroke: Stroke = {
  renderer: RENDERER, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, tool: "ink", color: "#252b25", size: 10, opacity: 1,
  points: [{ x: 20, y: 40, pressure: 0.2, time: 0 }, { x: 25, y: 50, pressure: 0.9, time: 20 }],
};

async function artistWithPost(api: RedrawApi, username: string) {
  await api.auth.register({ username, password: `${username}-password-123` });
  await api.canvas.stroke({ key: crypto.randomUUID(), sequence: 1, timestamp: 1, change: JSON.stringify(stroke) });
  await api.canvas.submit({ key: crypto.randomUUID(), sequence: 2 });
  const published = await api.posts.publish({ index: 1 });
  if ("error" in published) throw new Error(published.error);
  return published.post;
}

/** Narrows an endpoint answer to its success shape, failing the test on an error. */
const ok = <T extends object>(value: T): Exclude<T, { error: unknown }> => {
  if ("error" in value) throw new Error(String(value.error));
  return value as Exclude<T, { error: unknown }>;
};

describe("Following artists", () => {
  test("suggestions exclude the viewer and followed artists, and the feed marks follows and likes", async () => {
    const { browser } = createApp(database.db);
    const [maya, ben, ana] = [browser(), browser(), browser()];
    const mayaPost = await artistWithPost(maya, "maya");
    await artistWithPost(ben, "ben");
    await ana.auth.register({ username: "ana", password: "ana-password-123" });

    expect(ok(await ana.people.following()).following.people).toEqual([]);
    expect(ok(await ana.people.suggestions()).suggestions.people.map(p => p.username)).toEqual(["ben", "maya"]);
    expect(ok(await maya.people.suggestions()).suggestions.people.map(p => p.username)).toEqual(["ben"]);

    expect(await ana.people.follow({ username: "maya" })).toEqual({});
    expect(await ana.people.follow({ username: "maya" })).toEqual({ error: "CONFLICT" });
    expect(await ana.people.follow({ username: "ana" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await ana.people.follow({ username: "ghost" })).toEqual({ error: "NOT_FOUND" });
    expect(ok(await ana.people.following()).following.people.map(p => p.username)).toEqual(["maya"]);
    const suggestions = ok(await ana.people.suggestions()).suggestions.people;
    expect(suggestions).toEqual([expect.objectContaining({ username: "ben", posts: 1, followers: 0 })]);

    expect(await ana.posts.like({ post: mayaPost })).toEqual({});
    expect(await ana.posts.like({ post: mayaPost })).toEqual({ error: "CONFLICT" });
    await ben.posts.like({ post: mayaPost });
    const feed = ok(await ana.posts.feed({ before: "" })).page.posts;
    expect(feed.map(p => [p.username, p.following, p.liked, p.likes])).toEqual([["ben", false, false, 0], ["maya", true, true, 2]]);

    expect(await ana.posts.unlike({ post: mayaPost })).toEqual({});
    expect(await ana.posts.unlike({ post: mayaPost })).toEqual({ error: "NOT_FOUND" });
    expect(await ana.people.unfollow({ username: "maya" })).toEqual({});
    expect(await ana.people.unfollow({ username: "maya" })).toEqual({ error: "NOT_FOUND" });
    expect(ok(await ana.people.following()).following.people).toEqual([]);
  });

  test("search finds artists by the start of their username, ignoring case, and shows whether they are followed", async () => {
    const { browser } = createApp(database.db);
    const [maya, mira, ben] = [browser(), browser(), browser()];
    await maya.auth.register({ username: "Maya", password: "maya-password-123" });
    await mira.auth.register({ username: "mira_lines", password: "mira-password-123" });
    await ben.auth.register({ username: "ben", password: "ben-password-123" });
    await ben.people.follow({ username: "mira_lines" });

    const results = ok(await ben.people.search({ prefix: "m" })).results.people;
    expect(results.map(p => [p.username, p.following, p.followers])).toEqual([["Maya", false, 0], ["mira_lines", true, 1]]);
    expect(ok(await ben.people.search({ prefix: "MI" })).results.people.map(p => p.username)).toEqual(["mira_lines"]);
    expect(ok(await maya.people.search({ prefix: "ma" })).results.people).toEqual([]);
    expect(ok(await ben.people.search({ prefix: "zzz" })).results.people).toEqual([]);
    expect(await ben.people.search({ prefix: "" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await ben.people.search({ prefix: "m.*" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await browser().people.search({ prefix: "m" })).toEqual({ error: "UNAUTHORIZED" });
  });

  test("retracting a post forgets its likes, and liking a missing post is refused", async () => {
    const { browser } = createApp(database.db);
    const [maya, ben] = [browser(), browser()];
    const post = await artistWithPost(maya, "maya");
    await ben.auth.register({ username: "ben", password: "ben-password-123" });
    await ben.posts.like({ post });
    await maya.posts.retract({ post });
    expect(await ben.posts.like({ post })).toEqual({ error: "NOT_FOUND" });
    expect(await database.db.collection("liking.likes").countDocuments({})).toBe(0);
    const again = ok(await maya.posts.publish({ index: 1 })).post;
    expect(ok(await ben.posts.feed({ before: "" })).page.posts).toEqual([expect.objectContaining({ post: again, likes: 0, liked: false })]);
  });
});
