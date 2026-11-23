import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CANVAS_HEIGHT, CANVAS_WIDTH, RENDERER, type Stroke } from "../../src/drawing/stroke.ts";
import { createApp, type RedrawApi } from "../app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";
import { WEBP } from "../webp.ts";

let database: TestDb;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => { await database.db.dropDatabase(); });
afterAll(async () => { await database.close(); });

const stroke: Stroke = {
  renderer: RENDERER, width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
  tool: "ink", color: "#252b25", size: 10, opacity: 1,
  points: [{ x: 20, y: 40, pressure: 0.2, time: 0 }, { x: 25, y: 50, pressure: 0.9, time: 20 }],
};

/** Draws one stroke and submits it, returning the stroke request so replays can be compared. */
async function submitTimelapse(api: RedrawApi, sequence: number) {
  const ink = { key: crypto.randomUUID(), sequence, timestamp: 1730000000000, change: JSON.stringify(stroke) };
  await api.canvas.stroke(ink);
  await api.canvas.submit({ key: crypto.randomUUID(), sequence: sequence + 1, image: WEBP });
  return ink;
}

describe("Sharing timelapses", () => {
  test("artists publish their own timelapses, others browse and replay them, and retracting makes them private again", async () => {
    const { browser } = createApp(database.db);
    const maya = browser();
    expect(await maya.posts.feed({ before: "" })).toEqual({ error: "UNAUTHORIZED" });
    expect(await maya.posts.publish({ index: 1 })).toEqual({ error: "UNAUTHORIZED" });
    await maya.auth.register({ username: "maya", password: "maya-password-123" });
    expect(await maya.posts.publish({ index: 1 })).toEqual({ error: "NOT_FOUND" });
    const ink = await submitTimelapse(maya, 1);
    expect(await maya.posts.status({ index: 1 })).toEqual({ post: null });
    const published = await maya.posts.publish({ index: 1 });
    if ("error" in published) throw new Error(published.error);
    expect(await maya.posts.publish({ index: 1 })).toEqual({ error: "CONFLICT" });
    expect(await maya.posts.status({ index: 1 })).toEqual({ post: published.post });

    const ben = browser();
    await ben.auth.register({ username: "ben", password: "ben-password-123" });
    await submitTimelapse(ben, 1);
    const bens = await ben.posts.publish({ index: 1 });
    if ("error" in bens) throw new Error(bens.error);

    const feed = await ben.posts.feed({ before: "" });
    if ("error" in feed) throw new Error(feed.error);
    expect(feed.page.posts.map(p => [p.username, p.index])).toEqual([["ben", 1], ["maya", 1]]);
    expect(feed.page.posts[1]!.post).toBe(published.post);

    const replay = await ben.posts.timelapse({ post: published.post, after: 0 });
    if ("error" in replay) throw new Error(replay.error);
    expect(replay.found).toBe(true);
    expect(replay.updates).toEqual([ink]);
    expect(await ben.posts.picture({ post: published.post })).toEqual({ found: true, image: WEBP });

    expect(await ben.posts.retract({ post: published.post })).toEqual({ error: "NOT_FOUND" });
    expect(await maya.posts.retract({ post: published.post })).toEqual({ post: published.post });
    expect(await ben.posts.timelapse({ post: published.post, after: 0 })).toEqual({ found: false, updates: [], createdAt: 0 });
    expect(await ben.posts.picture({ post: published.post })).toEqual({ found: false, image: "" });
    const after = await ben.posts.feed({ before: "" });
    if ("error" in after) throw new Error(after.error);
    expect(after.page.posts.map(p => p.username)).toEqual(["ben"]);
    expect(await maya.canvas.timelapse({ index: 1, after: 0 })).toEqual({ found: true, updates: [ink] });
  });

  test("requests cannot name an author or reach unposted recordings", async () => {
    const { browser } = createApp(database.db);
    const maya = browser();
    await maya.auth.register({ username: "maya", password: "maya-password-123" });
    await submitTimelapse(maya, 1);
    expect(await maya.posts.publish({ index: 1, author: "ben" } as never)).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya.posts.timelapse({ post: "0".repeat(24) as never, after: 0 })).toEqual({ found: false, updates: [], createdAt: 0 });
    expect(await maya.posts.picture({ post: "0".repeat(24) as never })).toEqual({ found: false, image: "" });
    expect(await maya.posts.feed({ before: "nope" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya.posts.publish({ index: 0 })).toEqual({ error: "INVALID_REQUEST" });
  });
});
