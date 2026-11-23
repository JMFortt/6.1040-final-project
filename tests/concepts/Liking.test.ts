import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AlreadyLiked, LikingConcept, NotLiked } from "../../src/concepts/Liking/Liking.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let liking: LikingConcept<string, string>;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => { await database.db.dropDatabase(); liking = new LikingConcept(database.db); });
afterAll(async () => { await database.close(); });

describe("Liking", () => {
  test("its principle: two likes count once each, a repeat is refused, unliking and forgetting remove them", async () => {
    await liking.like({ person: "ben", item: "drawing" });
    await liking.like({ person: "ana", item: "drawing" });
    expect(await liking._count({ item: "drawing" })).toEqual({ count: 2 });
    expect(await liking._likes({ person: "ben", item: "drawing" })).toEqual({ liked: true });
    await expect(liking.like({ person: "ben", item: "drawing" })).rejects.toBeInstanceOf(AlreadyLiked);
    await liking.unlike({ person: "ana", item: "drawing" });
    expect(await liking._count({ item: "drawing" })).toEqual({ count: 1 });
    await expect(liking.unlike({ person: "ana", item: "drawing" })).rejects.toBeInstanceOf(NotLiked);
    await liking.like({ person: "ben", item: "other" });
    await liking.forget({ item: "drawing" });
    expect(await liking._count({ item: "drawing" })).toEqual({ count: 0 });
    expect(await liking._count({ item: "other" })).toEqual({ count: 1 });
    expect(await liking._likes({ person: "nobody", item: "drawing" })).toEqual({ liked: false });
  });
});
