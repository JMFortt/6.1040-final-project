import { MongoServerError, type Collection, type Db } from "mongodb";

export class AlreadyLiked extends Error {}
export class NotLiked extends Error {}

interface LikeDocument<Person, Item> {
  person: Person;
  item: Item;
}

/** Lets people show appreciation for an item with one lightweight gesture. */
export class LikingConcept<Person extends string, Item extends string> {
  private readonly likes: Collection<LikeDocument<Person, Item>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Liking") {
    this.likes = database.collection(`${name.toLowerCase()}.likes`);
  }

  /** The unique index refuses a second like even when two arrive at once. A failed setup is retried. */
  #ready() {
    this.indexes ??= this.likes
      .createIndexes([{ key: { person: 1, item: 1 }, unique: true }, { key: { item: 1 } }])
      .catch((error: unknown) => { this.indexes = undefined; throw error; });
    return this.indexes;
  }

  async like({ person, item }: { person: Person; item: Item }) {
    await this.#ready();
    try {
      await this.likes.insertOne({ person, item });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) throw new AlreadyLiked("You already like this.");
      throw error;
    }
    return {};
  }

  async unlike({ person, item }: { person: Person; item: Item }) {
    const { deletedCount } = await this.likes.deleteOne({ person, item } as never);
    if (deletedCount === 0) throw new NotLiked("You have not liked this.");
    return {};
  }

  async forget({ item }: { item: Item }) {
    await this.likes.deleteMany({ item } as never);
    return {};
  }

  async _count({ item }: { item: Item }) {
    return { count: await this.likes.countDocuments({ item } as never) };
  }

  async _likes({ person, item }: { person: Person; item: Item }) {
    return { liked: (await this.likes.countDocuments({ person, item } as never, { limit: 1 })) > 0 };
  }
}
