import { MongoServerError, type Collection, type Db } from "mongodb";

export class FirstCurator extends Error {}
export class NotCurator extends Error {}
export class AlreadyCurator extends Error {}
export class InvalidImage extends Error {}
export class ImageKeyReused extends Error {}
export class SourceReused extends Error {}
export class ImageNotFound extends Error {}

const MAX_KEY = 80;
const MAX_SOURCE = 2048;
const MAX_CREDIT = 300;
const MAX_TAG = 40;
const MAX_TAGS = 8;

interface ImageDocument<Fundamental extends string> {
  id: string;
  key: string;
  source: string;
  credit: string;
  tags: Fundamental[];
  lastUsed?: number;
}

interface AssignmentDocument<Fundamental extends string> {
  day: number;
  fundamental: Fundamental;
  image: string;
}

interface CuratorDocument<Admin extends string> {
  admin: Admin;
}

interface FoundingDocument<Admin extends string> {
  _id: "founded";
  admin: Admin;
}

const duplicate = (error: unknown): error is MongoServerError => error instanceof MongoServerError && error.code === 11000;

const empty = () => ({ found: false, image: "", source: "", credit: "" });

const text = (value: unknown, max: number) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null;
};

const keyOf = (value: unknown) => typeof value === "string" && value.length >= 1 && value.length <= MAX_KEY ? value : null;

/** Distinct trimmed tags, or null when the list is not 1 to 8 well-formed tags. Duplicates count once. */
const tagsOf = <Fundamental extends string>(value: unknown): Fundamental[] | null => {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_TAGS) return null;
  const tags = new Set<Fundamental>();
  for (const tag of value) {
    const formed = text(tag, MAX_TAG);
    if (!formed) return null;
    tags.add(formed as Fundamental);
  }
  return [...tags].sort() as Fundamental[];
};

const sameTags = <Fundamental extends string>(a: readonly Fundamental[], b: readonly Fundamental[]) =>
  a.length === b.length && a.every((tag, index) => tag === b[index]);

/**
 * Gives every artist the same photo for a fundamental on a given day. The caller
 * supplies the day. The first request of that day assigns one photo to each
 * fundamental that has one, preferring photos that were used least recently and
 * skipping a photo already assigned to another fundamental today.
 *
 * Tags live on the image document, which is the spec's Tags set: one entry per
 * (image, fundamental) pair. Writing the image and its tags is one insert.
 */
export class ReferencePhotoBinningConcept<Admin extends string, Fundamental extends string> {
  private readonly images: Collection<ImageDocument<Fundamental>>;
  private readonly assignments: Collection<AssignmentDocument<Fundamental>>;
  private readonly curators: Collection<CuratorDocument<Admin>>;
  private readonly founding: Collection<FoundingDocument<Admin>>;
  private readonly random: () => number;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "ReferencePhotoBinning", random: () => number = Math.random) {
    const prefix = name.toLowerCase();
    this.images = database.collection(`${prefix}.images`);
    this.assignments = database.collection(`${prefix}.assignments`);
    this.curators = database.collection(`${prefix}.curators`);
    this.founding = database.collection(`${prefix}.founding`);
    this.random = random;
  }

  /** Unique keys, sources, and curators. A failed setup is retried on the next action. */
  #ready() {
    this.indexes ??= Promise.all([
      this.images.createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { key: 1 }, unique: true },
        { key: { source: 1 }, unique: true },
      ]),
      this.curators.createIndex({ admin: 1 }, { unique: true }),
      this.assignments.createIndex({ day: 1, fundamental: 1 }, { unique: true }),
    ]).catch((error: unknown) => { this.indexes = undefined; throw error; });
    return this.indexes;
  }

  async #curator(admin: Admin) {
    return (await this.curators.findOne({ admin } as never)) !== null;
  }

  async appoint({ admin, curator }: { admin: Admin; curator: Admin }) {
    await this.#ready();
    if (await this.curators.countDocuments() === 0) {
      if (admin !== curator) throw new FirstCurator("The first curator must appoint themself.");
      try {
        await this.founding.insertOne({ _id: "founded", admin });
      } catch (error) {
        if (!duplicate(error)) throw error;
      }
      const founded = await this.founding.findOne({ _id: "founded" });
      if (founded?.admin !== admin) throw new NotCurator("Only a curator can change the reference bank.");
      await this.curators.updateOne({ admin } as never, { $setOnInsert: { admin } }, { upsert: true });
      return {};
    }
    if (!await this.#curator(admin)) throw new NotCurator("Only a curator can change the reference bank.");
    if (await this.#curator(curator)) throw new AlreadyCurator("This person is already a curator.");
    try {
      await this.curators.insertOne({ admin: curator });
    } catch (error) {
      if (!duplicate(error)) throw error;
      throw new AlreadyCurator("This person is already a curator.");
    }
    return {};
  }

  async add({ admin, key, source, credit, tags }: { admin: Admin; key: string; source: string; credit: string; tags: readonly Fundamental[] }) {
    if (!await this.#curator(admin)) throw new NotCurator("Only a curator can change the reference bank.");
    return this.#place(key, source, credit, tags);
  }

  /** Adds one photo without a curator. Startup uses it for the curated bank, and it is not an endpoint. */
  async provide({ key, source, credit, tags }: { key: string; source: string; credit: string; tags: readonly Fundamental[] }) {
    return this.#place(key, source, credit, tags);
  }

  async #place(key: string, source: string, credit: string, tags: readonly Fundamental[]) {
    const formedKey = keyOf(key);
    const formedSource = text(source, MAX_SOURCE);
    const formedCredit = text(credit, MAX_CREDIT);
    const formedTags = tagsOf<Fundamental>(tags);
    if (!formedKey || !formedSource || !formedCredit || !formedTags) {
      throw new InvalidImage("The image needs a key, a source, a credit, and one to eight tags.");
    }
    await this.#ready();
    const existing = await this.images.findOne({ key: formedKey });
    if (existing) return this.#retry(existing, formedSource, formedCredit, formedTags);
    if (await this.images.findOne({ source: formedSource })) throw new SourceReused("This reference is already in the bank.");
    try {
      const image = crypto.randomUUID();
      await this.images.insertOne({ id: image, key: formedKey, source: formedSource, credit: formedCredit, tags: formedTags });
      return { image };
    } catch (error) {
      if (!duplicate(error)) throw error;
      const raced = await this.images.findOne({ key: formedKey });
      if (raced) return this.#retry(raced, formedSource, formedCredit, formedTags);
      if (await this.images.findOne({ source: formedSource })) throw new SourceReused("This reference is already in the bank.");
      throw error;
    }
  }

  /** A repeated add with the same key and content returns the original id. */
  #retry(existing: ImageDocument<Fundamental>, source: string, credit: string, tags: Fundamental[]) {
    if (existing.source !== source || existing.credit !== credit || !sameTags(existing.tags, tags)) {
      throw new ImageKeyReused("This image identifier has already been used.");
    }
    return { image: existing.id };
  }

  async remove({ admin, image }: { admin: Admin; image: string }) {
    if (!await this.#curator(admin)) throw new NotCurator("Only a curator can change the reference bank.");
    await this.#ready();
    const removed = await this.images.deleteOne({ id: image });
    if (removed.deletedCount === 0) throw new ImageNotFound("That reference is not in the bank.");
    await this.assignments.deleteMany({ image });
    return {};
  }

  async tag({ admin, image, tags }: { admin: Admin; image: string; tags: readonly Fundamental[] }) {
    if (!await this.#curator(admin)) throw new NotCurator("Only a curator can change the reference bank.");
    const formed = tagsOf<Fundamental>(tags);
    if (!formed) throw new InvalidImage("A reference needs one to eight tags.");
    await this.#ready();
    const updated = await this.images.updateOne({ id: image }, { $set: { tags: formed } });
    if (updated.matchedCount === 0) throw new ImageNotFound("That reference is not in the bank.");
    return {};
  }

  async _catalog() {
    await this.#ready();
    const images = await this.images.find().toArray();
    return {
      images: images
        .map(({ id, source, credit, tags, key }) => ({ image: id, source, credit, tags, key }))
        .sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
        .map(({ image, source, credit, tags }) => ({ image, source, credit, tags })),
    };
  }

  async _curator({ admin }: { admin: Admin }) {
    return { curator: await this.#curator(admin) };
  }

  async _vacant() {
    return { vacant: await this.curators.countDocuments() === 0 };
  }

  async request({ day, fundamental }: { day: number; fundamental: Fundamental }) {
    const formed = text(fundamental, MAX_TAG) as Fundamental | null;
    if (!Number.isSafeInteger(day) || day < 0 || !formed) return empty();
    await this.#ready();
    const images = await this.images.find().toArray();
    if (!images.some((image) => image.tags.includes(formed))) return empty();
    await this.#assignDay(day, images);
    const row = await this.assignments.findOne({ day, fundamental: formed });
    const image = row ? images.find((item) => item.id === row.image) ?? await this.images.findOne({ id: row.image }) : null;
    if (!row || !image || !image.tags.includes(formed)) return empty();
    return { found: true, image: image.id, source: image.source, credit: image.credit };
  }

  /** Fills every fundamental that still needs a photo for this day. A lost race keeps the winner. */
  async #assignDay(day: number, images: ImageDocument<Fundamental>[]) {
    const taken = new Set<string>();
    const held = new Set<Fundamental>();
    for (const row of await this.assignments.find({ day }).toArray()) {
      const image = images.find((item) => item.id === row.image && item.tags.includes(row.fundamental));
      if (!image) {
        await this.assignments.deleteOne({ day, fundamental: row.fundamental });
        continue;
      }
      held.add(row.fundamental);
      taken.add(row.image);
    }
    const fundamentals = [...new Set(images.flatMap((image) => image.tags))].sort();
    for (const fundamental of fundamentals) {
      if (held.has(fundamental)) continue;
      const chosen = this.#pick(images, fundamental, taken);
      if (!chosen) continue;
      try {
        await this.assignments.insertOne({ day, fundamental, image: chosen.id });
      } catch (error) {
        if (!duplicate(error)) throw error;
        const winner = await this.assignments.findOne({ day, fundamental });
        if (winner) this.#remember(images, taken, winner.image, day);
        continue;
      }
      await this.images.updateOne({ id: chosen.id }, { $set: { lastUsed: day } });
      this.#remember(images, taken, chosen.id, day);
    }
  }

  /** The least recently used photo with this fundamental, skipping photos already assigned today when another remains. */
  #pick(images: ImageDocument<Fundamental>[], fundamental: Fundamental, taken: ReadonlySet<string>) {
    const tagged = images.filter((image) => image.tags.includes(fundamental));
    const fresh = tagged.filter((image) => !taken.has(image.id));
    const pool = fresh.length > 0 ? fresh : tagged;
    if (pool.length === 0) return undefined;
    const age = (image: ImageDocument<Fundamental>) => image.lastUsed ?? -1;
    const oldest = Math.min(...pool.map(age));
    const tied = pool.filter((image) => age(image) === oldest).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const sample = this.random();
    const index = Number.isFinite(sample) ? Math.min(tied.length - 1, Math.max(0, Math.floor(sample * tied.length))) : 0;
    return tied[index];
  }

  #remember(images: ImageDocument<Fundamental>[], taken: Set<string>, id: string, day: number) {
    taken.add(id);
    const image = images.find((item) => item.id === id);
    if (image) image.lastUsed = day;
  }
}
