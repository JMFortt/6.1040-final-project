import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CoverageTrackingConcept, NoFundamentals, PracticeKeyReused } from "../../src/concepts/CoverageTracking/CoverageTracking.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let coverage: CoverageTrackingConcept<string, string>;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => {
  await database.db.dropDatabase();
  coverage = new CoverageTrackingConcept(database.db);
});
afterAll(async () => { await database.close(); });

const all = ["perspective", "lighting", "anatomy"];

describe("CoverageTracking", () => {
  test("its principle: counts per fundamental, neglected ones first, retries ignored, artists separate", async () => {
    await coverage.record({ artist: "maya", key: "drawing-1", fundamentals: ["perspective", "lighting"] });
    await coverage.record({ artist: "maya", key: "study-2", fundamentals: ["lighting"] });
    expect(await coverage._coverage({ artist: "maya", fundamentals: all })).toEqual([
      { fundamental: "anatomy", count: 0 },
      { fundamental: "perspective", count: 1 },
      { fundamental: "lighting", count: 2 },
    ]);
    expect(await coverage.record({ artist: "maya", key: "study-2", fundamentals: ["lighting"] })).toEqual({});
    expect(await coverage._coverage({ artist: "maya", fundamentals: ["lighting"] })).toEqual([{ fundamental: "lighting", count: 2 }]);
    expect(await coverage._coverage({ artist: "ben", fundamentals: all })).toEqual([
      { fundamental: "anatomy", count: 0 },
      { fundamental: "lighting", count: 0 },
      { fundamental: "perspective", count: 0 },
    ]);
  });

  test("treats fundamentals as a set: duplicates and order do not matter", async () => {
    await coverage.record({ artist: "maya", key: "a", fundamentals: ["lighting", "perspective", "lighting"] });
    expect(await coverage.record({ artist: "maya", key: "a", fundamentals: ["perspective", "lighting"] })).toEqual({});
    expect(await coverage._coverage({ artist: "maya", fundamentals: ["lighting", "lighting"] })).toEqual([{ fundamental: "lighting", count: 1 }]);
  });

  test("refuses an empty practice and a key reused with different fundamentals", async () => {
    await expect(coverage.record({ artist: "maya", key: "a", fundamentals: [] })).rejects.toBeInstanceOf(NoFundamentals);
    await coverage.record({ artist: "maya", key: "a", fundamentals: ["lighting"] });
    await expect(coverage.record({ artist: "maya", key: "a", fundamentals: ["anatomy"] })).rejects.toBeInstanceOf(PracticeKeyReused);
    await expect(coverage.record({ artist: "maya", key: "a", fundamentals: ["lighting", "anatomy"] })).rejects.toBeInstanceOf(PracticeKeyReused);
    expect(await coverage._coverage({ artist: "maya", fundamentals: ["lighting", "anatomy"] })).toEqual([
      { fundamental: "anatomy", count: 0 },
      { fundamental: "lighting", count: 1 },
    ]);
  });

  test("keys belong to one artist, and concurrent retries record once", async () => {
    await coverage.record({ artist: "maya", key: "same", fundamentals: ["lighting"] });
    await coverage.record({ artist: "ben", key: "same", fundamentals: ["anatomy"] });
    const results = await Promise.all(Array.from({ length: 5 }, () => coverage.record({ artist: "ana", key: "k", fundamentals: ["color"] })));
    expect(results).toEqual(Array(5).fill({}));
    expect(await coverage._coverage({ artist: "ana", fundamentals: ["color"] })).toEqual([{ fundamental: "color", count: 1 }]);
    expect(await coverage._coverage({ artist: "ben", fundamentals: ["lighting", "anatomy"] })).toEqual([
      { fundamental: "lighting", count: 0 },
      { fundamental: "anatomy", count: 1 },
    ]);
  });

  test("answers no rows when asked about no fundamentals", async () => {
    expect(await coverage._coverage({ artist: "maya", fundamentals: [] })).toEqual([]);
  });
});
