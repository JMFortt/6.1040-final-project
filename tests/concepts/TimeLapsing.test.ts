import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { EmptyHistory, InvalidCompletion, NothingToRedo, NothingToUndo, StaleHistory, TimeLapsingConcept, UpdateKeyReused } from "../../src/concepts/TimeLapsing/TimeLapsing.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let recording: TimeLapsingConcept<string>;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => {
  await database.db.dropDatabase();
  recording = new TimeLapsingConcept(database.db);
});
afterAll(async () => { await database.close(); });
const update = (sequence = 1) => ({ owner: "maya", sequence, key: crypto.randomUUID(), change: "immutable change", timestamp: 1000 });
const picture = "cached-picture";

describe("TimeLapsing", () => {
  test("its principle: Maya completes independent recordings, returns to replay them, and retries without duplicates; Ben's histories stay separate", async () => {
    const first = update();
    await recording.addUpdate(first);
    const submission = { owner: "maya", key: crypto.randomUUID(), sequence: 2, image: picture };
    expect(await recording.complete(submission)).toEqual({ index: 1, sequence: 2 });
    expect(await recording._picture({ owner: "maya", index: 1 })).toEqual({ found: true, image: picture });
    await expect(recording.complete({ ...submission, image: "other-picture" })).rejects.toBeInstanceOf(UpdateKeyReused);
    expect(await recording._history({ owner: "maya", after: 0 })).toEqual({ start: 2, tip: 2, updates: [], redo: 0 });
    const reopened = new TimeLapsingConcept<string>(database.db);
    const second = update(3);
    await reopened.addUpdate(second);
    expect(await reopened.complete(submission)).toEqual({ index: 1, sequence: 2 });
    expect((await reopened._history({ owner: "maya", after: 0 })).updates.map(u => u.key)).toEqual([second.key]);
    const firstReplay = await reopened._recording({ owner: "maya", index: 1, after: 0 });
    const { owner, ...expected } = first;
    expect(firstReplay).toEqual({ found: true, updates: [expected] });
    expect(await reopened.addUpdate({ ...first, sequence: 4 })).toEqual({ sequence: 1 });
    expect(await reopened.complete({ owner, key: crypto.randomUUID(), sequence: 4, image: picture })).toEqual({ index: 2, sequence: 4 });
    expect((await reopened._recordings({ owner, after: 0 })).recordings.map(r => [r.index, r.count])).toEqual([[1, 1], [2, 1]]);
    expect(await reopened._recording({ owner: "ben", index: 1, after: 0 })).toEqual({ found: false, updates: [] });
    expect(await reopened._recordings({ owner: "ben", after: 0 })).toEqual({ recordings: [] });
  });

  test("completion indices are unique in the database while ordinary updates and other owners remain independent", async () => {
    const events = database.db.collection("timelapsing.updates");
    // Simulate an existing installation with its original lookup index.
    await events.createIndex({ owner: 1, kind: 1, index: 1 });
    await recording.addUpdate(update());
    await recording.addUpdate(update(2));
    await recording.complete({ owner: "maya", key: crypto.randomUUID(), sequence: 3, image: picture });
    const completion = await events.findOne({ owner: "maya", kind: "completion" });
    const { _id, ...duplicate } = completion!;
    await expect(events.insertOne({ ...duplicate, key: crypto.randomUUID(), sequence: 4 })).rejects.toMatchObject({ code: 11000 });
    await recording.addUpdate({ ...update(), owner: "ben" });
    expect(await recording.complete({ owner: "ben", key: crypto.randomUUID(), sequence: 2, image: picture })).toEqual({ index: 1, sequence: 2 });
    expect((await recording._recordings({ owner: "maya", after: 0 })).recordings).toHaveLength(1);
  });

  test("completion timestamps use server time and remain unchanged on retry", async () => {
    let now = 123456;
    const timed = new TimeLapsingConcept<string>(database.db, "TimedRecording", () => new Date(now));
    await timed.addUpdate({ ...update(), timestamp: 999999 });
    const completion = { owner: "maya", key: crypto.randomUUID(), sequence: 2, image: picture };
    await timed.complete(completion);
    now += 1000;
    await timed.complete(completion);
    expect(await timed._recordings({ owner: "maya", after: 0 })).toEqual({ recordings: [{ index: 1, count: 1, createdAt: 123456 }] });
  });

  test("invalid recording indices never match stored recordings", async () => {
    await recording.addUpdate(update());
    await recording.complete({ owner: "maya", key: crypto.randomUUID(), sequence: 2, image: picture });
    for (const index of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, { $gt: 0 } as never]) {
      expect(await recording._recording({ owner: "maya", index, after: 0 })).toEqual({ found: false, updates: [] });
    }
  });

  test("empty, malformed, reused, and stale completions leave the history intact", async () => {
    const submission = { owner: "maya", key: crypto.randomUUID(), sequence: 1, image: picture };
    await expect(recording.complete(submission)).rejects.toBeInstanceOf(EmptyHistory);
    await expect(recording.complete({ ...submission, key: "bad" })).rejects.toBeInstanceOf(InvalidCompletion);
    const first = update();
    await recording.addUpdate(first);
    await expect(recording.complete(submission)).rejects.toBeInstanceOf(StaleHistory);
    await expect(recording.complete({ ...submission, key: first.key, sequence: 2 })).rejects.toBeInstanceOf(UpdateKeyReused);
    expect((await recording._history({ owner: "maya", after: 0 })).updates).toHaveLength(1);
    await recording.complete({ ...submission, sequence: 2 });
    await expect(recording.complete({ ...submission, sequence: 3 })).rejects.toBeInstanceOf(UpdateKeyReused);
    await expect(recording.addUpdate({ ...update(3), key: submission.key })).rejects.toBeInstanceOf(UpdateKeyReused);
    await expect(recording.complete({ ...submission, key: crypto.randomUUID(), sequence: 3 })).rejects.toBeInstanceOf(EmptyHistory);
  });

  test("racing stroke and completion share a sequence: no stroke is omitted or overwritten", async () => {
    await recording.addUpdate(update());
    const second = update(2);
    const results = await Promise.allSettled([
      recording.addUpdate(second),
      recording.complete({ owner: "maya", key: crypto.randomUUID(), sequence: 2, image: picture }),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")?.reason).toBeInstanceOf(StaleHistory);
    if (results[0]!.status === "fulfilled") {
      expect((await recording._history({ owner: "maya", after: 0 })).updates).toHaveLength(2);
      await recording.complete({ owner: "maya", key: crypto.randomUUID(), sequence: 3, image: picture });
      expect((await recording._recording({ owner: "maya", index: 1, after: 0 })).updates).toHaveLength(2);
    } else {
      expect((await recording._recording({ owner: "maya", index: 1, after: 0 })).updates).toHaveLength(1);
      expect(await recording._history({ owner: "maya", after: 0 })).toEqual({ start: 2, tip: 2, updates: [], redo: 0 });
    }
  });

  test("simultaneous completion retries create one index and recordings paginate in order", async () => {
    await recording.addUpdate(update());
    const submission = { owner: "maya", key: crypto.randomUUID(), sequence: 2, image: picture };
    expect(await Promise.all([recording.complete(submission), recording.complete(submission)])).toEqual([{ index: 1, sequence: 2 }, { index: 1, sequence: 2 }]);
    for (let index = 2; index <= 22; index++) {
      await recording.addUpdate(update(index * 2 - 1));
      await recording.complete({ owner: "maya", key: crypto.randomUUID(), sequence: index * 2, image: picture });
    }
    expect((await recording._recordings({ owner: "maya", after: 0 })).recordings).toHaveLength(20);
    expect((await recording._recordings({ owner: "maya", after: 20 })).recordings.map(r => r.index)).toEqual([21, 22]);
  });
  test("retries survive re-instantiation without recording duplicates", async () => {
    const input = update();
    await recording.addUpdate(input);
    const reopened = new TimeLapsingConcept<string>(database.db);
    expect(await reopened.addUpdate({ ...input, sequence: 2 })).toEqual({ sequence: 1 });
    expect((await reopened._history({ owner: "maya", after: 0 })).updates).toHaveLength(1);
    await expect(reopened.addUpdate({ ...input, change: "different" })).rejects.toBeInstanceOf(UpdateKeyReused);
    expect(await reopened._history({ owner: "ben", after: 0 })).toEqual({ start: 0, tip: 0, updates: [], redo: 0 });
  });

  test("racing appends cannot overwrite a sequence; the loser can retry", async () => {
    const a = update();
    const b = update();
    const results = await Promise.allSettled([recording.addUpdate(a), recording.addUpdate(b)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected")!;
    expect(rejected.status === "rejected" && rejected.reason).toBeInstanceOf(StaleHistory);
    await recording.addUpdate({ ...(results[0]!.status === "rejected" ? a : b), sequence: 2 });
    const history = await recording._history({ owner: "maya", after: 0 });
    expect(history.updates.map((item) => item.sequence)).toEqual([1, 2]);
    expect(new Set(history.updates.map((item) => item.key)).size).toBe(2);
  });

  test("pagination preserves append order even when client clocks disagree", async () => {
    for (let sequence = 1; sequence <= 53; sequence++) {
      await recording.addUpdate({ ...update(sequence), timestamp: 10000 - sequence });
    }
    const first = (await recording._history({ owner: "maya", after: 0 })).updates;
    const second = (await recording._history({ owner: "maya", after: 50 })).updates;
    expect(first).toHaveLength(50);
    expect(second.map((item) => item.sequence)).toEqual([51, 52, 53]);
    expect(first[0]!.timestamp).toBeGreaterThan(first[1]!.timestamp);
    await recording.complete({ owner: "maya", key: crypto.randomUUID(), sequence: 54, image: picture });
    await recording.addUpdate(update(55));
    expect((await recording._recording({ owner: "maya", index: 1, after: 0 })).updates).toEqual(first);
    expect((await recording._recording({ owner: "maya", index: 1, after: 50 })).updates).toEqual(second);
    expect((await recording._history({ owner: "maya", after: 0 })).updates.map(u => u.sequence)).toEqual([55]);
  });

  test("undo and redo fold the drawing, and a new stroke drops the redo", async () => {
    const first = update(1);
    const second = update(2);
    await recording.addUpdate(first);
    await recording.addUpdate(second);
    const undoKey = crypto.randomUUID();
    const undone = await recording.undo({ owner: "maya", key: undoKey, sequence: 3, timestamp: 2000 });
    expect(undone).toEqual({ sequence: 3, removed: second.key });
    expect(await recording.undo({ owner: "maya", key: undoKey, sequence: 3, timestamp: 2000 })).toEqual(undone);
    expect(await recording._history({ owner: "maya", after: 0 })).toEqual({
      start: 0, tip: 3, redo: 1,
      updates: [{ key: first.key, sequence: 1, change: first.change, timestamp: first.timestamp }],
    });
    const redoKey = crypto.randomUUID();
    const redone = await recording.redo({ owner: "maya", key: redoKey, sequence: 4, timestamp: 3000 });
    expect(redone).toEqual({ sequence: 4, key: second.key, change: second.change, timestamp: second.timestamp });
    expect(await recording.redo({ owner: "maya", key: redoKey, sequence: 4, timestamp: 3000 })).toEqual(redone);
    await expect(recording.redo({ owner: "maya", key: crypto.randomUUID(), sequence: 5, timestamp: 3001 })).rejects.toBeInstanceOf(NothingToRedo);
    await recording.undo({ owner: "maya", key: crypto.randomUUID(), sequence: 5, timestamp: 4000 });
    const third = update(6);
    await recording.addUpdate(third);
    await expect(recording.redo({ owner: "maya", key: crypto.randomUUID(), sequence: 7, timestamp: 5000 })).rejects.toBeInstanceOf(NothingToRedo);
    const history = await recording._history({ owner: "maya", after: 0 });
    expect(history.updates.map((item) => item.key)).toEqual([first.key, third.key]);
    expect(history.tip).toBe(6);
    expect(history.redo).toBe(0);
    await recording.undo({ owner: "maya", key: crypto.randomUUID(), sequence: 7, timestamp: 6000 });
    await recording.undo({ owner: "maya", key: crypto.randomUUID(), sequence: 8, timestamp: 6001 });
    await expect(recording.undo({ owner: "maya", key: crypto.randomUUID(), sequence: 9, timestamp: 6002 })).rejects.toBeInstanceOf(NothingToUndo);
    await expect(recording.complete({ owner: "maya", key: crypto.randomUUID(), sequence: 9, image: picture })).rejects.toBeInstanceOf(EmptyHistory);
  });
});
