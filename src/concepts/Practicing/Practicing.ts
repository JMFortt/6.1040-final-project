import type { Collection, Db } from "mongodb";

export class InvalidAttempt extends Error {}
export class NotPracticing extends Error {}

interface AttemptDocument<Artist extends string> {
  _id: Artist;
  fundamental: string;
  image: string;
  source: string;
  credit: string;
  startedAt?: number;
}

const text = (value: unknown, max: number) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null;
};

/** One open practice per artist. The caller supplies the clock. */
export class PracticingConcept<Artist extends string, Fundamental extends string> {
  private readonly attempts: Collection<AttemptDocument<Artist>>;

  constructor(database: Db, name = "Practicing") {
    this.attempts = database.collection(`${name.toLowerCase()}.attempts`);
  }

  async begin({ artist, fundamental, image, source, credit }: { artist: Artist; fundamental: Fundamental; image: string; source: string; credit: string }) {
    const formed = text(fundamental, 40);
    const id = text(image, 80);
    const located = text(source, 2048);
    const credited = text(credit, 300);
    if (!formed || !id || !located || !credited) throw new InvalidAttempt("A practice needs one fundamental and a reference.");
    const existing = await this.attempts.findOne({ _id: artist });
    if (existing) return this.#view(existing);
    await this.attempts.updateOne(
      { _id: artist },
      { $setOnInsert: { _id: artist, fundamental: formed, image: id, source: located, credit: credited } },
      { upsert: true },
    );
    const stored = await this.attempts.findOne({ _id: artist });
    if (!stored) throw new InvalidAttempt("A practice needs one fundamental and a reference.");
    return this.#view(stored);
  }

  async start({ artist, instant }: { artist: Artist; instant: Date | number | string }) {
    const time = new Date(instant).getTime();
    if (!Number.isSafeInteger(time) || time < 0) throw new InvalidAttempt("A practice needs one fundamental and a reference.");
    const started = await this.attempts.findOneAndUpdate(
      { _id: artist, startedAt: { $exists: false } },
      { $set: { startedAt: time } },
      { returnDocument: "after" },
    );
    if (started) return { startedAt: started.startedAt! };
    const current = await this.attempts.findOne({ _id: artist });
    if (!current) throw new NotPracticing("There is no practice to time.");
    return { startedAt: current.startedAt ?? time };
  }

  async end({ artist }: { artist: Artist }) {
    await this.attempts.deleteOne({ _id: artist });
    return {};
  }

  async _current({ artist }: { artist: Artist }) {
    const attempt = await this.attempts.findOne({ _id: artist });
    if (!attempt) return { practicing: false, fundamental: "", image: "", source: "", credit: "", started: false, startedAt: 0 };
    return { practicing: true, ...this.#view(attempt) };
  }

  #view(attempt: AttemptDocument<Artist>) {
    return {
      fundamental: attempt.fundamental as Fundamental,
      image: attempt.image,
      source: attempt.source,
      credit: attempt.credit,
      started: attempt.startedAt !== undefined,
      startedAt: attempt.startedAt ?? 0,
    };
  }
}
