import { MongoServerError, type Collection, type Db } from "mongodb";

export class CannotFollowSelf extends Error {}
export class AlreadyFollowing extends Error {}
export class NotFollowing extends Error {}

interface FollowDocument<Person> {
  follower: Person;
  followee: Person;
  since: number;
}

/** Lets a person choose whose work they want to keep up with. */
export class FollowingConcept<Person extends string> {
  private readonly follows: Collection<FollowDocument<Person>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Following", private readonly clock: () => Date = () => new Date()) {
    this.follows = database.collection(`${name.toLowerCase()}.follows`);
  }

  /** The unique index refuses a duplicate follow even when two arrive at once. A failed setup is retried. */
  #ready() {
    this.indexes ??= this.follows
      .createIndexes([{ key: { follower: 1, followee: 1 }, unique: true }, { key: { followee: 1 } }])
      .catch((error: unknown) => { this.indexes = undefined; throw error; });
    return this.indexes;
  }

  async follow({ follower, followee }: { follower: Person; followee: Person }) {
    if (follower === followee) throw new CannotFollowSelf("You cannot follow yourself.");
    await this.#ready();
    try {
      await this.follows.insertOne({ follower, followee, since: this.clock().getTime() });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) throw new AlreadyFollowing("You already follow this person.");
      throw error;
    }
    return {};
  }

  async unfollow({ follower, followee }: { follower: Person; followee: Person }) {
    const { deletedCount } = await this.follows.deleteOne({ follower, followee } as never);
    if (deletedCount === 0) throw new NotFollowing("You do not follow this person.");
    return {};
  }

  async _following({ follower }: { follower: Person }) {
    const found = await this.follows.find({ follower } as never).sort({ since: -1, _id: -1 }).toArray();
    return found.map(({ followee, since }) => ({ followee, since }));
  }

  async _isFollowing({ follower, followee }: { follower: Person; followee: Person }) {
    const found = follower !== followee && (await this.follows.countDocuments({ follower, followee } as never, { limit: 1 })) > 0;
    return { following: found };
  }

  async _followerCount({ followee }: { followee: Person }) {
    return { count: await this.follows.countDocuments({ followee } as never) };
  }
}
