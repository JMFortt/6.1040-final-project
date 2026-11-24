import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { ReferencePhotoBinningConcept } from "../../src/concepts/ReferencePhotoBinning/ReferencePhotoBinning.ts";
import { stockPhotos } from "../../src/practice/stock-catalog.ts";
import { stockReferenceBank } from "../../src/practice/stock.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => { await database.db.dropDatabase(); });
afterAll(async () => { await database.close(); });

describe("reference stock", () => {
  test("introduces each curated photo once and does not restore one a curator removed", async () => {
    expect(await stockReferenceBank(database.db)).toBe(stockPhotos.length);
    expect(await stockReferenceBank(database.db)).toBe(0);
    const bank = new ReferencePhotoBinningConcept<string, string>(database.db);
    const catalog = await bank._catalog();
    expect(catalog.images.map((image) => image.source).sort()).toEqual(stockPhotos.map((photo) => photo.source).sort());

    await bank.appoint({ admin: "ada", curator: "ada" });
    const removed = catalog.images[0];
    if (!removed) throw new Error("the bank was empty");
    await bank.remove({ admin: "ada", image: removed.image });
    expect(await stockReferenceBank(database.db)).toBe(0);
    const after = await bank._catalog();
    expect(after.images).toHaveLength(stockPhotos.length - 1);
    expect(after.images.some((image) => image.image === removed.image)).toBe(false);
  });
});
