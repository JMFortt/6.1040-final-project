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

describe("Drawing session", () => {
  test("stores today's shared photo, starts the clock once, and discard or submit clears the attempt", async () => {
    let now = new Date("2026-11-23T15:00:00Z");
    const { browser } = createApp(database.db, () => now);
    const ada = browser();
    const maya = browser();
    expect(await maya.practice.current()).toEqual({ error: "UNAUTHORIZED" });
    await ada.auth.register({ username: "ada", password: "ada-password-1" });
    await maya.auth.register({ username: "maya", password: "maya-password-1" });
    expect(await ada.practice.begin({ fundamental: "lighting" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await ada.references.appoint({ username: "ada" })).toEqual({});
    const lamp = await ada.references.add({ key: "lamp", source: "https://example.test/lamp.jpg", credit: "Grace Hopper", tags: ["lighting"] });
    if ("error" in lamp) throw new Error(lamp.error);

    const begun = await maya.practice.begin({ fundamental: "lighting" });
    expect(begun).toMatchObject({ fundamental: "lighting", image: lamp.image, source: "https://example.test/lamp.jpg", credit: "Grace Hopper", started: false, startedAt: 0 });
    expect(await ada.practice.begin({ fundamental: "lighting" })).toMatchObject({ image: lamp.image, started: false });
    expect(await maya.practice.current()).toEqual({ practicing: true, ...begun });

    now = new Date("2026-11-23T15:05:00Z");
    const started = await maya.practice.start();
    if ("error" in started) throw new Error(started.error);
    expect(started.startedAt).toBe(now.getTime());
    now = new Date("2026-11-23T15:10:00Z");
    expect(await maya.practice.start()).toEqual(started);
    expect(await maya.practice.current()).toMatchObject({ started: true, startedAt: started.startedAt });

    await maya.canvas.stroke({ key: crypto.randomUUID(), sequence: 1, timestamp: 1, change: JSON.stringify(stroke) });
    const drawn = await maya.canvas.history({ after: 0 });
    if ("error" in drawn) throw new Error(drawn.error);
    expect(drawn.updates).toHaveLength(1);
    expect(await maya.practice.discard()).toEqual({});
    expect(await maya.practice.current()).toMatchObject({ practicing: false, started: false });
    expect(await maya.canvas.history({ after: 0 })).toMatchObject({ updates: [], tip: 0 });

    const again = await maya.practice.begin({ fundamental: "lighting" });
    if ("error" in again) throw new Error(again.error);
    await maya.canvas.stroke({ key: crypto.randomUUID(), sequence: 1, timestamp: 2, change: JSON.stringify(stroke) });
    expect(await maya.canvas.submit({ key: crypto.randomUUID(), sequence: 2, image: WEBP })).toMatchObject({ index: 1 });
    expect(await maya.practice.current()).toMatchObject({ practicing: false });
    expect(await maya.canvas.timelapses({ after: 0 })).toMatchObject({ recordings: [{ index: 1 }] });
  });
});
