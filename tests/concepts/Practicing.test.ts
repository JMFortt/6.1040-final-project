import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { InvalidAttempt, NotPracticing, PracticingConcept } from "../../src/concepts/Practicing/Practicing.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let practice: PracticingConcept<string, string>;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => {
  await database.db.dropDatabase();
  practice = new PracticingConcept(database.db);
});
afterAll(async () => { await database.close(); });

const lamp = { artist: "maya", fundamental: "lighting", image: "lamp", source: "https://example.test/lamp.jpg", credit: "Grace Hopper" };
const idle = { practicing: false, fundamental: "", image: "", source: "", credit: "", started: false, startedAt: 0 };

describe("Practicing", () => {
  test("its principle: one attempt, the clock starts once, and finishing clears it", async () => {
    expect(await practice._current({ artist: "maya" })).toEqual(idle);
    const begun = await practice.begin(lamp);
    expect(begun).toEqual({ fundamental: "lighting", image: "lamp", source: lamp.source, credit: lamp.credit, started: false, startedAt: 0 });
    expect(await practice.begin({ ...lamp, fundamental: "color", image: "other" })).toEqual(begun);
    expect(await practice._current({ artist: "maya" })).toEqual({ practicing: true, ...begun });

    const started = await practice.start({ artist: "maya", instant: new Date(1_000) });
    expect(started).toEqual({ startedAt: 1_000 });
    expect(await practice.start({ artist: "maya", instant: new Date(9_000) })).toEqual(started);
    expect(await practice._current({ artist: "maya" })).toMatchObject({ started: true, startedAt: 1_000, image: "lamp" });

    expect(await practice.end({ artist: "maya" })).toEqual({});
    expect(await practice.end({ artist: "maya" })).toEqual({});
    expect(await practice._current({ artist: "maya" })).toEqual(idle);
    await expect(practice.start({ artist: "maya", instant: new Date(1_000) })).rejects.toBeInstanceOf(NotPracticing);
  });

  test("refuses a practice with no reference, and keeps artists separate", async () => {
    await expect(practice.begin({ ...lamp, image: "  " })).rejects.toBeInstanceOf(InvalidAttempt);
    await expect(practice.start({ artist: "maya", instant: new Date(Number.NaN) })).rejects.toBeInstanceOf(InvalidAttempt);
    await practice.begin(lamp);
    await practice.begin({ ...lamp, artist: "ben", fundamental: "form" });
    expect(await practice._current({ artist: "ben" })).toMatchObject({ fundamental: "form" });
    expect(await practice._current({ artist: "maya" })).toMatchObject({ fundamental: "lighting" });
  });
});
