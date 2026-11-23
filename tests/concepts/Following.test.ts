import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AlreadyFollowing, CannotFollowSelf, FollowingConcept, NotFollowing } from "../../src/concepts/Following/Following.ts";
import { openTestDb, type TestDb } from "../test-db.ts";

let database: TestDb;
let following: FollowingConcept<string>;
let now = 1000;
beforeAll(async () => { database = await openTestDb(); });
beforeEach(async () => {
  await database.db.dropDatabase();
  now = 1000;
  following = new FollowingConcept(database.db, "Following", () => new Date(now++));
});
afterAll(async () => { await database.close(); });

describe("Following", () => {
  test("its principle: Maya follows Ben and Ana, cannot follow twice or herself, and unfollows Ana", async () => {
    await following.follow({ follower: "maya", followee: "ben" });
    await following.follow({ follower: "maya", followee: "ana" });
    expect(await following._following({ follower: "maya" })).toEqual([{ followee: "ana", since: 1001 }, { followee: "ben", since: 1000 }]);
    expect(await following._followerCount({ followee: "ben" })).toEqual({ count: 1 });
    await expect(following.follow({ follower: "maya", followee: "ben" })).rejects.toBeInstanceOf(AlreadyFollowing);
    await expect(following.follow({ follower: "maya", followee: "maya" })).rejects.toBeInstanceOf(CannotFollowSelf);
    await following.unfollow({ follower: "maya", followee: "ana" });
    expect((await following._following({ follower: "maya" })).map(f => f.followee)).toEqual(["ben"]);
    await expect(following.unfollow({ follower: "maya", followee: "ana" })).rejects.toBeInstanceOf(NotFollowing);
  });

  test("answers for unknown people and follows only one way", async () => {
    await following.follow({ follower: "maya", followee: "ben" });
    expect(await following._isFollowing({ follower: "maya", followee: "ben" })).toEqual({ following: true });
    expect(await following._isFollowing({ follower: "ben", followee: "maya" })).toEqual({ following: false });
    expect(await following._isFollowing({ follower: "maya", followee: "maya" })).toEqual({ following: false });
    expect(await following._following({ follower: "nobody" })).toEqual([]);
    expect(await following._followerCount({ followee: "nobody" })).toEqual({ count: 0 });
  });
});
