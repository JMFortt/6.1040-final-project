import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AlreadyCurator, FirstCurator, ImageKeyReused, ImageNotFound, InvalidImage, NotCurator, ReferencePhotoBinningConcept, SourceReused } from "../../src/concepts/ReferencePhotoBinning/ReferencePhotoBinning.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let bank: ReferencePhotoBinningConcept<string, string>;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => {
  await database.db.dropDatabase();
  bank = new ReferencePhotoBinningConcept(database.db);
});
afterAll(async () => { await database.close(); });

const street = { key: "street", source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] as const };
const harbor = { key: "harbor", source: "https://example.test/harbor.jpg", credit: "Ada Lovelace", tags: ["perspective"] as const };
const lamp = { key: "lamp", source: "https://example.test/lamp.jpg", credit: "Grace Hopper", tags: ["lighting"] as const };
const plaza = { key: "plaza", source: "https://example.test/plaza.jpg", credit: "Grace Hopper", tags: ["color", "lighting"] as const };
const empty = { found: false, image: "", source: "", credit: "" };

describe("ReferencePhotoBinning", () => {
  test("its principle: one photo per fundamental per day, then the one used least recently", async () => {
    await expect(bank.add({ admin: "ada", ...street })).rejects.toBeInstanceOf(NotCurator);
    await expect(bank.appoint({ admin: "ada", curator: "maya" })).rejects.toBeInstanceOf(FirstCurator);
    await bank.appoint({ admin: "ada", curator: "ada" });
    await bank.appoint({ admin: "ada", curator: "ben" });

    const addedStreet = await bank.add({ admin: "ada", ...street });
    const addedHarbor = await bank.add({ admin: "ben", ...harbor });
    const [first, raced] = await Promise.all([
      bank.request({ day: 0, fundamental: "perspective" }),
      bank.request({ day: 0, fundamental: "perspective" }),
    ]);
    expect(first).toEqual(raced);
    expect(first.found).toBe(true);
    expect([addedStreet.image, addedHarbor.image]).toContain(first.image);
    expect(await bank.request({ day: 0, fundamental: " perspective " })).toEqual(first);

    const next = await bank.request({ day: 1, fundamental: "perspective" });
    expect([addedStreet.image, addedHarbor.image].filter((image) => image !== first.image)).toEqual([next.image]);
    expect(await bank.request({ day: 2, fundamental: "perspective" })).toMatchObject({ image: first.image });

    await bank.tag({ admin: "ada", image: first.image, tags: ["lighting"] });
    expect(await bank.request({ day: 2, fundamental: "perspective" })).toMatchObject({ found: true, image: next.image });
    expect(await bank.request({ day: 2, fundamental: "lighting" })).toMatchObject({ image: first.image });

    await bank.remove({ admin: "ada", image: next.image });
    expect(await bank.request({ day: 2, fundamental: "perspective" })).toEqual(empty);
    expect(await bank.request({ day: 2, fundamental: "lighting" })).toMatchObject({ image: first.image });
  });

  test("skips a photo already assigned today unless it is the only one tagged with the fundamental", async () => {
    await bank.appoint({ admin: "ada", curator: "ada" });
    const addedStreet = await bank.add({ admin: "ada", ...street, tags: ["color"] });
    const addedLamp = await bank.add({ admin: "ada", ...lamp });
    expect(await bank.request({ day: 0, fundamental: "color" })).toMatchObject({ image: addedStreet.image });
    expect(await bank.request({ day: 0, fundamental: "lighting" })).toMatchObject({ image: addedLamp.image });

    const addedPlaza = await bank.add({ admin: "ada", ...plaza });
    const color = await bank.request({ day: 1, fundamental: "color" });
    const lighting = await bank.request({ day: 1, fundamental: "lighting" });
    expect(color).toMatchObject({ found: true, image: addedPlaza.image, source: plaza.source });
    expect(lighting).toMatchObject({ image: addedLamp.image });

    await bank.remove({ admin: "ada", image: addedLamp.image });
    expect(await bank.request({ day: 1, fundamental: "lighting" })).toMatchObject({ image: addedPlaza.image });
    expect(await bank.request({ day: 1, fundamental: "color" })).toEqual(color);
  });

  test("retries the same photo and refuses a reused key or source", async () => {
    await bank.appoint({ admin: "ada", curator: "ada" });
    const added = await bank.add({ admin: "ada", ...street });
    expect(await bank.add({ admin: "ada", key: street.key, source: `  ${street.source}  `, credit: street.credit, tags: ["perspective", "perspective"] })).toEqual(added);
    await expect(bank.add({ admin: "ada", ...street, credit: "someone else" })).rejects.toBeInstanceOf(ImageKeyReused);
    await expect(bank.add({ admin: "ada", ...lamp, source: street.source })).rejects.toBeInstanceOf(SourceReused);
    expect(await bank.request({ day: 0, fundamental: "perspective" })).toMatchObject({ image: added.image, source: street.source });
  });

  test("refuses a malformed photo, a missing photo, and a second appointment", async () => {
    await bank.appoint({ admin: "ada", curator: "ada" });
    await expect(bank.appoint({ admin: "ada", curator: "ada" })).rejects.toBeInstanceOf(AlreadyCurator);
    await expect(bank.add({ admin: "maya", ...street })).rejects.toBeInstanceOf(NotCurator);
    await expect(bank.add({ admin: "ada", ...street, tags: [] })).rejects.toBeInstanceOf(InvalidImage);
    await expect(bank.add({ admin: "ada", ...street, credit: "  " })).rejects.toBeInstanceOf(InvalidImage);
    await expect(bank.add({ admin: "ada", ...street, tags: Array.from({ length: 9 }, (_, index) => `tag${index}`) })).rejects.toBeInstanceOf(InvalidImage);
    const added = await bank.add({ admin: "ada", ...street });
    await expect(bank.tag({ admin: "ada", image: added.image, tags: ["lighting"] })).resolves.toEqual({});
    await expect(bank.remove({ admin: "ada", image: "missing" })).rejects.toBeInstanceOf(ImageNotFound);
    await expect(bank.tag({ admin: "ada", image: "missing", tags: ["lighting"] })).rejects.toBeInstanceOf(ImageNotFound);
    await bank.remove({ admin: "ada", image: added.image });
    await expect(bank.remove({ admin: "ada", image: added.image })).rejects.toBeInstanceOf(ImageNotFound);
    expect(await bank.request({ day: -1, fundamental: "lighting" })).toEqual(empty);
    expect(await bank.request({ day: 1.5, fundamental: "lighting" })).toEqual(empty);
    expect(await bank.request({ day: 0, fundamental: "  " })).toEqual(empty);
    expect(await bank.request({ day: 0, fundamental: "lighting" })).toEqual(empty);
  });
});
