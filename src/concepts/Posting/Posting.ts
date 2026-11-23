import { MongoServerError, ObjectId, type Collection, type Db, type Filter } from "mongodb";

export class AlreadyPublished extends Error {}
export class PostNotFound extends Error {}

export type Post = string & { readonly __brand: "Post" };

interface PostDocument<Author, Work> {
  _id: Post;
  author: Author;
  work: Work;
  createdAt: number;
}

const PAGE = 20;

/**
 * Lets an author share a finished piece of work with others, credited to them,
 * for as long as they choose to keep it up.
 *
 * Post identities are ObjectId hex strings. They sort by creation, which gives
 * the feed its newest-first order and a stable cursor.
 */
export class PostingConcept<Author extends string, Work extends string | number> {
  private readonly posts: Collection<PostDocument<Author, Work>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Posting", private readonly clock: () => Date = () => new Date()) {
    this.posts = database.collection(`${name.toLowerCase()}.posts`);
  }

  /** The unique index makes a duplicate publish fail even when two arrive at once. A failed setup is retried. */
  #ready() {
    this.indexes ??= this.posts
      .createIndex({ author: 1, work: 1 }, { unique: true })
      .catch((error: unknown) => { this.indexes = undefined; throw error; });
    return this.indexes;
  }

  async publish({ author, work }: { author: Author; work: Work }) {
    await this.#ready();
    const post = new ObjectId().toHexString() as Post;
    try {
      await this.posts.insertOne({ _id: post, author, work, createdAt: this.clock().getTime() });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AlreadyPublished("You have already shared this piece.");
      }
      throw error;
    }
    return { post };
  }

  async retract({ author, post }: { author: Author; post: Post }) {
    const { deletedCount } = await this.posts.deleteOne({ _id: post, author });
    if (deletedCount === 0) throw new PostNotFound("There is no such post.");
    return { post };
  }

  async _feed({ before }: { before: string }) {
    if (before !== "" && !ObjectId.isValid(before)) return [];
    if (before !== "" && (await this.posts.countDocuments({ _id: before as Post }, { limit: 1 })) === 0) return [];
    const filter = before === "" ? {} : { _id: { $lt: before as Post } };
    const found = await this.posts.find(filter).sort({ _id: -1 }).limit(PAGE).toArray();
    return found.map(({ _id, author, work, createdAt }) => ({ post: _id, author, work, createdAt }));
  }

  async _get({ post }: { post: Post }) {
    const found = await this.posts.findOne({ _id: post });
    return found === null ? [] : [{ author: found.author, work: found.work, createdAt: found.createdAt }];
  }

  async _authors(_input: Record<string, never> = {}) {
    const found = await this.posts.aggregate<{ _id: Author; posts: number; latest: number; last: Post }>([
      { $group: { _id: "$author", posts: { $sum: 1 }, latest: { $max: "$createdAt" }, last: { $max: "$_id" } } },
      { $sort: { last: -1 } },
      { $limit: PAGE },
    ]).toArray();
    return found.map(({ _id, posts, latest }) => ({ author: _id, posts, latest }));
  }

  async _publishedAs({ author, work }: { author: Author; work: Work }) {
    const found = await this.posts.findOne({ author, work } as Filter<PostDocument<Author, Work>>);
    return found === null ? [] : [{ post: found._id }];
  }
}
