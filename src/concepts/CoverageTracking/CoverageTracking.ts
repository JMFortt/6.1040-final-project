import { MongoServerError, type Collection, type Db } from "mongodb";

export class NoFundamentals extends Error {}
export class PracticeKeyReused extends Error {}

/**
 * One practice and its exercises. The spec's Exercises set is the `fundamentals`
 * array: one entry per (practice, fundamental) pair, kept distinct and sorted, so a
 * practice and its exercises are recorded in one atomic insert.
 */
interface PracticeDocument<Artist, Fundamental> {
  artist: Artist;
  key: string;
  fundamentals: Fundamental[];
}

/** Distinct values in a stable order, so two sets compare equal exactly when their arrays do. */
const distinct = <T extends string>(values: readonly T[]) => [...new Set(values)].sort();
const sameSet = <T>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((value, i) => value === b[i]);

/**
 * Shows an artist how much they have practiced each fundamental, so the fundamentals
 * they avoid become visible instead of quietly dropping out of their practice.
 */
export class CoverageTrackingConcept<Artist extends string, Fundamental extends string> {
  private readonly practices: Collection<PracticeDocument<Artist, Fundamental>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "CoverageTracking") {
    this.practices = database.collection(`${name.toLowerCase()}.practices`);
  }

  /** The unique index makes a reused key fail even when two records arrive at once. A failed setup is retried. */
  #ready() {
    this.indexes ??= this.practices
      .createIndexes([{ key: { artist: 1, key: 1 }, unique: true }, { key: { artist: 1, fundamentals: 1 } }])
      .catch((error: unknown) => { this.indexes = undefined; throw error; });
    return this.indexes;
  }

  async record({ artist, key, fundamentals }: { artist: Artist; key: string; fundamentals: readonly Fundamental[] }) {
    const exercised = distinct(fundamentals);
    if (exercised.length === 0) throw new NoFundamentals("A practice must exercise at least one fundamental.");
    await this.#ready();
    const existing = await this.practices.findOne({ artist, key } as never);
    if (existing) return this.#retry(existing, exercised);
    try {
      await this.practices.insertOne({ artist, key, fundamentals: exercised });
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      const raced = await this.practices.findOne({ artist, key } as never);
      if (!raced) throw error;
      return this.#retry(raced, exercised);
    }
    return {};
  }

  /** A repeated record with the same fundamentals changes nothing; different fundamentals are refused. */
  #retry(existing: PracticeDocument<Artist, Fundamental>, exercised: Fundamental[]) {
    if (!sameSet(existing.fundamentals, exercised)) {
      throw new PracticeKeyReused("This practice has already been recorded with different fundamentals.");
    }
    return {};
  }

  async _coverage({ artist, fundamentals }: { artist: Artist; fundamentals: readonly Fundamental[] }) {
    const asked = distinct(fundamentals);
    if (asked.length === 0) return [];
    const counted = await this.practices.aggregate<{ _id: Fundamental; count: number }>([
      { $match: { artist, fundamentals: { $in: asked } } },
      { $unwind: "$fundamentals" },
      { $match: { fundamentals: { $in: asked } } },
      { $group: { _id: "$fundamentals", count: { $sum: 1 } } },
    ]).toArray();
    const counts = new Map(counted.map(({ _id, count }) => [_id, count]));
    return asked
      .map((fundamental) => ({ fundamental, count: counts.get(fundamental) ?? 0 }))
      .sort((a, b) => a.count - b.count || (a.fundamental < b.fundamental ? -1 : a.fundamental > b.fundamental ? 1 : 0));
  }
}
