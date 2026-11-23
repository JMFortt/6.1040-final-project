import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CANVAS_HEIGHT, CANVAS_WIDTH, RENDERER, type Stroke } from "../../src/drawing/stroke.ts";
import { createApp } from "../app.ts";
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
const request = (value: Stroke = stroke, sequence = 1) => ({
  key: crypto.randomUUID(), sequence, timestamp: 1730000000000, change: JSON.stringify(value),
});

describe("Canvas", () => {
  test("submits numbered private timelapses, clears the draft, and preserves ordered ink and eraser playback", async () => {
    const { browser } = createApp(database.db);
    const maya = browser();
    const submission = { key: crypto.randomUUID(), sequence: 3, image: WEBP };
    expect(await maya.canvas.submit(submission)).toEqual({ error: "UNAUTHORIZED" });
    expect(await maya.canvas.timelapses({ after: 0 })).toEqual({ error: "UNAUTHORIZED" });
    expect(await maya.canvas.timelapse({ index: 1, after: 0 })).toEqual({ error: "UNAUTHORIZED" });
    await maya.auth.register({ username: "maya", password: "maya-password-123" });
    expect(await maya.canvas.submit({ key: crypto.randomUUID(), sequence: 1, image: WEBP })).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya.canvas.submit({ key: crypto.randomUUID(), sequence: 1, image: "not-a-webp" })).toEqual({ error: "INVALID_REQUEST" });
    const ink = request();
    const eraser = request({ ...stroke, tool: "eraser" }, 2);
    await maya.canvas.stroke(ink);
    await maya.canvas.stroke(eraser);
    expect(await maya.canvas.submit(submission)).toEqual({ index: 1, sequence: 3 });
    expect(await maya.canvas.history({ after: 0 })).toEqual({ start: 3, tip: 3, updates: [], redo: 0 });
    const next = request(stroke, 4);
    await maya.canvas.stroke(next);
    expect(await maya.canvas.submit(submission)).toEqual({ index: 1, sequence: 3 });
    expect(await maya.canvas.timelapse({ index: 1, after: 0 })).toEqual({ found: true, updates: [ink, eraser] });
    expect(await maya.canvas.history({ after: 0 })).toEqual({ start: 3, tip: 4, updates: [next], redo: 0 });
    expect(await maya.canvas.submit({ key: crypto.randomUUID(), sequence: 5, image: WEBP })).toEqual({ index: 2, sequence: 5 });
    expect(await maya.canvas.picture({ index: 1 })).toEqual({ found: true, image: WEBP });
    await maya.auth.logout();
    await maya.auth.login({ username: "maya", password: "maya-password-123" });
    const list = await maya.canvas.timelapses({ after: 0 });
    if ("error" in list) throw new Error(list.error);
    expect(list.recordings.map(r => [r.index, r.count])).toEqual([[1, 2], [2, 1]]);
    expect(await maya.canvas.history({ after: 0 })).toEqual({ start: 5, tip: 5, updates: [], redo: 0 });
    const ben = browser();
    await ben.auth.register({ username: "ben", password: "ben-password-123" });
    expect(await ben.canvas.timelapses({ after: 0 })).toEqual({ recordings: [] });
    expect(await ben.canvas.timelapse({ index: 1, after: 0 })).toEqual({ found: false, updates: [] });
    expect(await ben.canvas.timelapse({ index: 1, after: 0, owner: "maya" } as never)).toEqual({ error: "INVALID_REQUEST" });
    expect(await ben.canvas.submit({ ...submission, owner: "maya" } as never)).toEqual({ error: "INVALID_REQUEST" });
  });

  test("requires sign-in, restores exact ink and eraser records, and isolates artists", async () => {
    const { browser } = createApp(database.db);
    const maya = browser();
    expect(await maya["/canvas/history"]({ after: 0 })).toEqual({ error: "UNAUTHORIZED" });
    expect(await maya["/canvas/stroke"](request())).toEqual({ error: "UNAUTHORIZED" });
    await maya["/auth/register"]({ username: "maya", password: "maya-password-123" });
    const ink = request();
    const eraser = request({ ...stroke, tool: "eraser" }, 2);
    expect(await maya["/canvas/stroke"](ink)).toEqual({ sequence: 1 });
    expect(await maya["/canvas/stroke"](eraser)).toEqual({ sequence: 2 });
    await maya["/auth/logout"]();
    await maya["/auth/login"]({ username: "maya", password: "maya-password-123" });
    expect(await maya["/canvas/history"]({ after: 0 })).toEqual({ start: 0, tip: 2, updates: [ink, eraser], redo: 0 });
    const ben = browser();
    await ben["/auth/register"]({ username: "ben", password: "ben-password-123" });
    expect(await ben["/canvas/history"]({ after: 0 })).toEqual({ start: 0, tip: 0, updates: [], redo: 0 });
    expect(await maya["/canvas/stroke"](ink)).toEqual({ sequence: 1 });
    expect(await maya["/canvas/stroke"](request())).toEqual({ error: "CONFLICT" });
  });

  test("rejects malformed, oversized, unsupported strokes and forged owners", async () => {
    const { browser } = createApp(database.db);
    const maya = browser();
    await maya["/auth/register"]({ username: "maya", password: "maya-password-123" });
    const invalid = [
      { ...stroke, points: [] },
      { ...stroke, points: [{ x: -1, y: 4, pressure: 1, time: 0 }] },
      { ...stroke, points: [{ x: 1, y: 4, pressure: 1.1, time: 0 }] },
      { ...stroke, points: [{ x: 1, y: 4, pressure: 1, time: 10 }, { x: 2, y: 4, pressure: 1, time: 1 }] },
      { ...stroke, points: Array(4097).fill(stroke.points[0]) },
      { ...stroke, renderer: "unknown" },
      { ...stroke, size: 1000 },
    ];
    for (const value of invalid) {
      expect(await maya["/canvas/stroke"]({ ...request(), change: JSON.stringify(value) })).toEqual({ error: "INVALID_REQUEST" });
    }
    const forged = { ...request(), owner: "ben" };
    expect(await maya["/canvas/stroke"](forged)).toEqual({ error: "INVALID_REQUEST" });
    expect(await maya["/canvas/history"]({ after: 0 })).toEqual({ start: 0, tip: 0, updates: [], redo: 0 });
  });
});
