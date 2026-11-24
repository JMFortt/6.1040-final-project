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

const zeros = { anatomy: 0, color: 0, form: 0, lighting: 0, perspective: 0 };

async function coverage(api: RedrawApi) {
  const result = await api.coverage.current();
  if ("error" in result) throw new Error(result.error);
  return result.coverage.rows;
}

/** Begins a practice of `fundamental`, draws one stroke, and returns a submission with a fresh key. */
async function practice(api: RedrawApi, fundamental: string) {
  const begun = await api.practice.begin({ fundamental });
  if ("error" in begun) throw new Error(begun.error);
  const history = await api.canvas.history({ after: 0 });
  if ("error" in history) throw new Error(history.error);
  const sequence = history.tip + 1;
  await api.canvas.stroke({ key: crypto.randomUUID(), sequence, timestamp: 1, change: JSON.stringify(stroke) });
  return { key: crypto.randomUUID(), sequence: sequence + 1, image: WEBP };
}

describe("Fundamentals coverage", () => {
  test("a saved artwork counts once toward the chosen fundamental only; discards do not count", async () => {
    const { browser } = createApp(database.db, () => new Date("2026-11-23T15:00:00Z"));
    const ada = browser();
    const maya = browser();
    expect(await maya.coverage.current()).toEqual({ error: "UNAUTHORIZED" });
    await ada.auth.register({ username: "ada", password: "ada-password-1" });
    await maya.auth.register({ username: "maya", password: "maya-password-1" });
    await ada.references.appoint({ username: "ada" });
    // The plaza carries two tags; practicing lighting from it must count lighting alone.
    await ada.references.add({ key: "plaza", source: "https://example.test/plaza.jpg", credit: "Grace Hopper", tags: ["color", "lighting"] });
    await ada.references.add({ key: "street", source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] });

    const empty = await coverage(maya);
    expect(Object.fromEntries(empty.map(row => [row.fundamental, row.count]))).toEqual(zeros);
    expect(empty.map(row => row.fundamental)).toEqual(["anatomy", "color", "form", "lighting", "perspective"]);

    const lighting = await practice(maya, "lighting");
    expect(await maya.canvas.submit(lighting)).toMatchObject({ index: 1 });
    expect(await maya.practice.current()).toMatchObject({ practicing: false });
    // A retried submission returns its original result and must not count again.
    expect(await maya.canvas.submit(lighting)).toMatchObject({ index: 1 });

    await practice(maya, "perspective");
    expect(await maya.practice.discard()).toEqual({});

    const perspective = await practice(maya, "perspective");
    expect(await maya.canvas.submit(perspective)).toMatchObject({ index: 2 });

    const rows = await coverage(maya);
    expect(Object.fromEntries(rows.map(row => [row.fundamental, row.count]))).toEqual({ ...zeros, lighting: 1, perspective: 1 });
    expect(rows.slice(0, 3).every(row => row.count === 0)).toBe(true);

    expect(Object.fromEntries((await coverage(ada)).map(row => [row.fundamental, row.count]))).toEqual(zeros);
    expect(await maya.coverage.current({ artist: "ada" } as never)).toEqual({ error: "INVALID_REQUEST" });
  });
});
