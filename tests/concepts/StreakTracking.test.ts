import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { InvalidPeriod, StalePeriod, StreakTrackingConcept } from "../../src/concepts/StreakTracking/StreakTracking.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let streaks: StreakTrackingConcept<string>;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => {
  await database.db.dropDatabase();
  streaks = new StreakTrackingConcept(database.db);
});
afterAll(async () => { await database.close(); });

describe("StreakTracking", () => {
  test("its principle: the first engagement in a period counts, and a missed period resets the streak", async () => {
    expect(await streaks.engage({ user: "maya", period: 12 })).toEqual({ streakCount: 1 });
    expect(await streaks.engage({ user: "maya", period: 12 })).toEqual({ streakCount: 1 });
    expect(await streaks.engage({ user: "maya", period: 13 })).toEqual({ streakCount: 2 });
    expect(await streaks.expire({ user: "maya", period: 14 })).toEqual({ streakCount: 2 });
    expect(await streaks._getStreak({ user: "maya" })).toEqual({ streakCount: 2 });
    expect(await streaks.expire({ user: "maya", period: 15 })).toEqual({ streakCount: 0 });
    expect(await streaks._getStreak({ user: "maya" })).toEqual({ streakCount: 0 });
    expect(await streaks.engage({ user: "maya", period: 15 })).toEqual({ streakCount: 1 });
  });

  test("engaging after a gap starts over even when expire was not called", async () => {
    await streaks.engage({ user: "maya", period: 3 });
    await streaks.engage({ user: "maya", period: 4 });
    expect(await streaks.engage({ user: "maya", period: 9 })).toEqual({ streakCount: 1 });
  });

  test("keeps users separate and answers 0 for a user who never engaged", async () => {
    await streaks.engage({ user: "maya", period: 1 });
    await streaks.engage({ user: "maya", period: 2 });
    expect(await streaks._getStreak({ user: "ben" })).toEqual({ streakCount: 0 });
    expect(await streaks.expire({ user: "ben", period: 2 })).toEqual({ streakCount: 0 });
    expect(await streaks._getStreak({ user: "ben" })).toEqual({ streakCount: 0 });
    expect(await streaks.engage({ user: "ben", period: 2 })).toEqual({ streakCount: 1 });
    expect(await streaks._getStreak({ user: "maya" })).toEqual({ streakCount: 2 });
  });

  test("refuses invalid and stale periods without changing the streak", async () => {
    for (const period of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(streaks.engage({ user: "maya", period })).rejects.toBeInstanceOf(InvalidPeriod);
      await expect(streaks.expire({ user: "maya", period })).rejects.toBeInstanceOf(InvalidPeriod);
    }
    await streaks.engage({ user: "maya", period: 5 });
    await expect(streaks.engage({ user: "maya", period: 4 })).rejects.toBeInstanceOf(StalePeriod);
    expect(await streaks._getStreak({ user: "maya" })).toEqual({ streakCount: 1 });
  });

  test("concurrent engagements in the same period count once", async () => {
    await streaks.engage({ user: "maya", period: 7 });
    const results = await Promise.all(Array.from({ length: 5 }, () => streaks.engage({ user: "maya", period: 8 })));
    expect(results).toEqual(Array(5).fill({ streakCount: 2 }));
    const firsts = await Promise.all(Array.from({ length: 5 }, () => streaks.engage({ user: "ben", period: 8 })));
    expect(firsts).toEqual(Array(5).fill({ streakCount: 1 }));
  });
});
