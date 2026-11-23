import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidPeriod extends Error {}
export class StalePeriod extends Error {}

interface StreakDocument<User> {
  user: User;
  streakCount: number;
  lastActivePeriod: number;
}

const validPeriod = (period: number) => Number.isSafeInteger(period) && period >= 0;
// Each attempt that loses a race re-reads the streak; a few always suffice in practice.
const ATTEMPTS = 5;

/** Encourages users to interact consistently with a streak. */
export class StreakTrackingConcept<User extends string> {
  private readonly users: Collection<StreakDocument<User>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "StreakTracking") {
    this.users = database.collection(`${name.toLowerCase()}.users`);
  }

  /** One streak per user, even when two engagements arrive at once. A failed setup is retried. */
  #ready() {
    this.indexes ??= this.users.createIndex({ user: 1 }, { unique: true })
      .catch((error: unknown) => { this.indexes = undefined; throw error; });
    return this.indexes;
  }

  async engage({ user, period }: { user: User; period: number }) {
    if (!validPeriod(period)) throw new InvalidPeriod("The period is not valid.");
    await this.#ready();
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const streak = await this.users.findOne({ user } as never);
      if (!streak) {
        try {
          await this.users.insertOne({ user, streakCount: 1, lastActivePeriod: period });
          return { streakCount: 1 };
        } catch (error) {
          if (error instanceof MongoServerError && error.code === 11000) continue;
          throw error;
        }
      }
      if (streak.lastActivePeriod > period) throw new StalePeriod("This period has already passed.");
      if (streak.lastActivePeriod === period) return { streakCount: streak.streakCount };
      const streakCount = streak.lastActivePeriod === period - 1 ? streak.streakCount + 1 : 1;
      // Only apply the change if no other engagement moved the streak since it was read.
      const { matchedCount } = await this.users.updateOne(
        { user, lastActivePeriod: streak.lastActivePeriod, streakCount: streak.streakCount } as never,
        { $set: { lastActivePeriod: period, streakCount } },
      );
      if (matchedCount === 1) return { streakCount };
    }
    throw new Error(`StreakTracking.engage lost ${ATTEMPTS} races for one user.`);
  }

  async expire({ user, period }: { user: User; period: number }) {
    if (!validPeriod(period)) throw new InvalidPeriod("The period is not valid.");
    await this.#ready();
    await this.users.updateOne({ user, lastActivePeriod: { $lt: period - 1 } } as never, { $set: { streakCount: 0 } });
    return this._getStreak({ user });
  }

  async _getStreak({ user }: { user: User }) {
    const streak = await this.users.findOne({ user } as never);
    return { streakCount: streak?.streakCount ?? 0 };
  }
}
