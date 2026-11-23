import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AlreadyPublished, PostingConcept, PostNotFound, type Post } from "../../src/concepts/Posting/Posting.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let posting: PostingConcept<string, number>;
let now = 1000;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => {
  await database.db.dropDatabase();
  now = 1000;
  posting = new PostingConcept(database.db, "Posting", () => new Date(now++));
});
afterAll(async () => { await database.close(); });

describe("Posting", () => {
  test("its principle: posts appear newest first, credited to their author, until the author retracts them", async () => {
    const { post: first } = await posting.publish({ author: "maya", work: 1 });
    const { post: second } = await posting.publish({ author: "ben", work: 1 });
    expect(await posting._feed({ before: "" })).toEqual([
      { post: second, author: "ben", work: 1, createdAt: 1001 },
      { post: first, author: "maya", work: 1, createdAt: 1000 },
    ]);
    await expect(posting.publish({ author: "maya", work: 1 })).rejects.toBeInstanceOf(AlreadyPublished);
    await expect(posting.retract({ author: "ben", post: first })).rejects.toBeInstanceOf(PostNotFound);
    expect(await posting.retract({ author: "maya", post: first })).toEqual({ post: first });
    expect((await posting._feed({ before: "" })).map(p => p.post)).toEqual([second]);
    expect(await posting._get({ post: first })).toEqual([]);
  });

  test("a retracted piece can be shared again, and lookups answer by author and work", async () => {
    const { post } = await posting.publish({ author: "maya", work: 2 });
    expect(await posting._publishedAs({ author: "maya", work: 2 })).toEqual([{ post }]);
    expect(await posting._publishedAs({ author: "ben", work: 2 })).toEqual([]);
    expect(await posting._get({ post })).toEqual([{ author: "maya", work: 2, createdAt: 1000 }]);
    await posting.retract({ author: "maya", post });
    await expect(posting.retract({ author: "maya", post })).rejects.toBeInstanceOf(PostNotFound);
    expect(await posting._publishedAs({ author: "maya", work: 2 })).toEqual([]);
    const { post: again } = await posting.publish({ author: "maya", work: 2 });
    expect(again).not.toBe(post);
  });

  test("concurrent duplicate publishes leave exactly one post", async () => {
    const results = await Promise.allSettled([1, 2, 3].map(() => posting.publish({ author: "maya", work: 3 })));
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected").every(r => (r as PromiseRejectedResult).reason instanceof AlreadyPublished)).toBe(true);
  });

  test("the feed pages by cursor, 20 at a time, and an unknown cursor returns nothing", async () => {
    const posts: Post[] = [];
    for (let work = 1; work <= 25; work++) posts.push((await posting.publish({ author: "maya", work })).post);
    const first = await posting._feed({ before: "" });
    expect(first.map(p => p.work)).toEqual(Array.from({ length: 20 }, (_, i) => 25 - i));
    const second = await posting._feed({ before: first.at(-1)!.post });
    expect(second.map(p => p.work)).toEqual([5, 4, 3, 2, 1]);
    expect(await posting._feed({ before: "0".repeat(24) })).toEqual([]);
    expect(await posting._feed({ before: "not-a-post" })).toEqual([]);
  });
});
