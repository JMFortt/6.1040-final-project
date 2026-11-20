import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../app.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let testDb: TestDb;

beforeAll(async () => {
  testDb = await openTestDb();
});

beforeEach(async () => {
  await testDb.db.dropDatabase();
});

afterAll(async () => {
  await testDb.close();
});

describe("Passwords", () => {
  test("Ben signs up, signs out, and logs back in to the same account", async () => {
    const { browser } = createApp(testDb.db);
    const ben = browser();

    const signedUp = await ben["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    if ("error" in signedUp) throw new Error(JSON.stringify(signedUp));
    expect(await ben["/auth/me"]()).toEqual({ username: "ben" });

    expect(await ben["/auth/logout"]()).toEqual({});
    expect(await ben["/auth/me"]()).toEqual({ error: "UNAUTHORIZED" });

    const loggedIn = await ben["/auth/login"]({ username: "ben", password: "sea-shells-42" });
    if ("error" in loggedIn) throw new Error(JSON.stringify(loggedIn));
    expect(loggedIn.user).toBe(signedUp.user);
    expect(await ben["/auth/me"]()).toEqual({ username: "ben" });
  });

  test("a short password is refused before anyone is registered", async () => {
    const { browser } = createApp(testDb.db);
    const ben = browser();
    expect(await ben["/auth/register"]({ username: "ben", password: "short" })).toEqual({ error: "INVALID_REQUEST" });
    const signedUp = await ben["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    expect("error" in signedUp).toBe(false);
  });

  test("a wrong password and an unknown username get the same refusal", async () => {
    const { browser } = createApp(testDb.db);
    await browser()["/auth/register"]({ username: "ben", password: "sea-shells-42" });
    const leo = browser();
    expect(await leo["/auth/login"]({ username: "ben", password: "guessed-password" })).toEqual({
      error: "UNAUTHORIZED",
    });
    expect(await leo["/auth/login"]({ username: "nobody", password: "guessed-password" })).toEqual({
      error: "UNAUTHORIZED",
    });
    expect(await leo["/auth/me"]()).toEqual({ error: "UNAUTHORIZED" });
  });

  test("a Commons account cannot also be registered with that username and a password", async () => {
    const { browser, signIn } = createApp(testDb.db);
    await signIn(browser(), "sam");
    const leo = browser();
    expect(await leo["/auth/register"]({ username: "sam", password: "leos-password" })).toEqual({ error: "CONFLICT" });
    expect(await leo["/auth/login"]({ username: "sam", password: "leos-password" })).toEqual({ error: "UNAUTHORIZED" });
  });
});
