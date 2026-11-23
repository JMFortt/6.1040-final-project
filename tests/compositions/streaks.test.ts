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

/** Draws one stroke and submits it, starting at event sequence `sequence`. Returns the next free sequence. */
async function submitDrawing(api: RedrawApi, sequence: number) {
  await api.canvas.stroke({ key: crypto.randomUUID(), sequence, timestamp: 1730000000000, change: JSON.stringify(stroke) });
  const submitted = await api.canvas.submit({ key: crypto.randomUUID(), sequence: sequence + 1, image: WEBP });
  if ("error" in submitted) throw new Error(submitted.error);
  return sequence + 2;
}

const WEEK = 7 * 86_400_000;

describe("Weekly streaks", () => {
  test("submitting drawings builds a weekly Eastern Time streak that a missed week resets", async () => {
    let now = new Date("2026-11-25T17:00:00Z"); // Wednesday
    const { browser } = createApp(database.db, () => now);
    const maya = browser();
    expect(await maya.streaks.current()).toEqual({ error: "UNAUTHORIZED" });
    await maya.auth.register({ username: "maya", password: "maya-password-123" });
    expect(await maya.streaks.current()).toEqual({ streakCount: 0 });

    let sequence = await submitDrawing(maya, 1);
    expect(await maya.streaks.current()).toEqual({ streakCount: 1 });
    sequence = await submitDrawing(maya, sequence);
    expect(await maya.streaks.current()).toEqual({ streakCount: 1 });

    now = new Date("2026-11-30T04:30:00Z"); // Sunday 23:30 in New York, Monday in UTC: still the same week
    sequence = await submitDrawing(maya, sequence);
    expect(await maya.streaks.current()).toEqual({ streakCount: 1 });

    now = new Date("2026-11-30T05:30:00Z"); // Monday 00:30 in New York: the next week
    expect(await maya.streaks.current()).toEqual({ streakCount: 1 });
    sequence = await submitDrawing(maya, sequence);
    expect(await maya.streaks.current()).toEqual({ streakCount: 2 });

    now = new Date(now.getTime() + 2 * WEEK); // a whole week missed
    expect(await maya.streaks.current()).toEqual({ streakCount: 0 });
    await submitDrawing(maya, sequence);
    expect(await maya.streaks.current()).toEqual({ streakCount: 1 });

    const ben = browser();
    await ben.auth.register({ username: "ben", password: "ben-password-123" });
    expect(await ben.streaks.current()).toEqual({ streakCount: 0 });
    expect(await ben.streaks.current({ user: "maya" } as never)).toEqual({ error: "INVALID_REQUEST" });
  });
});
