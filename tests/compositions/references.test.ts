import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createApp, type RedrawApi } from "../app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => { await database.db.dropDatabase(); });
afterAll(async () => { await database.close(); });

const empty = { found: false, image: "", source: "", credit: "" };

describe("Reference bank", () => {
  test("every artist receives the same photo for a fundamental, and the next day receives the one used less recently", async () => {
    let now = new Date("2026-11-23T15:00:00Z");
    const { browser } = createApp(database.db, () => now);
    const ada = browser();
    const maya = browser();
    await ada.auth.register({ username: "ada", password: "ada-password-1" });
    await maya.auth.register({ username: "maya", password: "maya-password-1" });

    expect(await maya.references.request({ fundamental: "perspective" })).toEqual(empty);
    expect(await maya.references.add({ key: "street", source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] })).toEqual({ error: "FORBIDDEN" });

    expect(await ada.references.appoint({ username: "nobody" })).toEqual({ error: "NOT_FOUND" });
    expect(await ada.references.appoint({ username: "maya" })).toEqual({ error: "FORBIDDEN" });
    expect(await ada.references.appoint({ username: "ada" })).toEqual({});
    expect(await ada.references.appoint({ username: "ada" })).toEqual({ error: "CONFLICT" });
    expect(await ada.references.appoint({ username: "maya" })).toEqual({});

    const street = await ada.references.add({ key: "street", source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] });
    const harbor = await maya.references.add({ key: "harbor", source: "https://example.test/harbor.jpg", credit: "Ada Lovelace", tags: ["perspective"] });
    if ("error" in street || "error" in harbor) throw new Error("the photos were not added");
    expect(await ada.references.add({ key: "street", source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] })).toEqual(street);

    const today = await maya.references.request({ fundamental: "perspective" });
    expect(today).toEqual(await ada.references.request({ fundamental: "perspective" }));
    if ("error" in today) throw new Error(today.error);
    expect([street.image, harbor.image]).toContain(today.image);
    expect(today.found).toBe(true);

    now = new Date("2026-11-24T15:00:00Z");
    const tomorrow = await ada.references.request({ fundamental: "perspective" });
    if ("error" in tomorrow) throw new Error(tomorrow.error);
    expect(tomorrow.image).not.toBe(today.image);
    expect(await maya.references.request({ fundamental: "perspective" })).toEqual(tomorrow);

    now = new Date("2026-11-25T15:00:00Z");
    expect(await maya.references.request({ fundamental: "perspective" })).toMatchObject({ image: today.image });

    const ben = browser();
    await ben.auth.register({ username: "ben", password: "ben-password-1" });
    expect(await ben.references.remove({ image: today.image })).toEqual({ error: "FORBIDDEN" });
    expect(await ada.references.remove({ image: today.image })).toEqual({});
    expect(await ben.references.request({ fundamental: "perspective" })).toMatchObject({ found: true, image: tomorrow.image });
  });

  test("only a curator can read the whole bank", async () => {
    const { browser } = createApp(database.db);
    const ada = browser();
    const maya = browser();
    await ada.auth.register({ username: "ada", password: "ada-password-1" });
    await maya.auth.register({ username: "maya", password: "maya-password-1" });
    expect(await maya.references.access()).toEqual({ curator: false, vacant: true });
    expect(await maya.references.catalog()).toEqual({ error: "FORBIDDEN" });
    expect(await ada.references.appoint({ username: "ada" })).toEqual({});
    expect(await ada.references.access()).toEqual({ curator: true, vacant: false });
    expect(await maya.references.access()).toEqual({ curator: false, vacant: false });
    expect(await ada.references.catalog()).toEqual({ images: [] });
    const street = await ada.references.add({ key: "street", source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] });
    if ("error" in street) throw new Error(street.error);
    expect(await ada.references.catalog()).toEqual({
      images: [{ image: street.image, source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] }],
    });
    expect(await maya.references.catalog()).toEqual({ error: "FORBIDDEN" });
  });

  test("rejects a request that is not one fundamental", async () => {
    const { browser } = createApp(database.db);
    const ada = browser();
    await ada.auth.register({ username: "ada", password: "ada-password-1" });
    await ada.references.appoint({ username: "ada" });
    expect(await ada.references.add({ key: "", source: "https://example.test/street.jpg", credit: "Ada Lovelace", tags: ["perspective"] })).toEqual({ error: "INVALID_REQUEST" });
    expect(await (ada as RedrawApi).references.request({ fundamental: "" })).toEqual({ error: "INVALID_REQUEST" });
    expect(await (ada as RedrawApi).references.request({ tags: ["perspective"] } as never)).toEqual({ error: "INVALID_REQUEST" });
  });
});
