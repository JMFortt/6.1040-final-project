import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidUpdate extends Error {}
export class UpdateKeyReused extends Error {}
export class StaleHistory extends Error {}
export class InvalidCompletion extends Error {}
export class EmptyHistory extends Error {}

export interface RecordedUpdate {
  key: string;
  sequence: number;
  change: string;
  timestamp: number;
}
interface UpdateDocument<Owner> extends RecordedUpdate { owner: Owner; kind?: "update" }
interface CompletionDocument<Owner> {
  owner: Owner;
  kind: "completion";
  key: string;
  sequence: number;
  index: number;
  start: number;
  count: number;
  createdAt: number;
}
type EventDocument<Owner> = UpdateDocument<Owner> | CompletionDocument<Owner>;
const uuid = (value: unknown) => typeof value === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
const cursor = (value: number) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const updateValue = ({ key, sequence, change, timestamp }: RecordedUpdate): RecordedUpdate => ({ key, sequence, change, timestamp });

/** Preserves independent, ordered recordings as immutable ranges of one event log. */
export class TimeLapsingConcept<Owner extends string> {
  private readonly events: Collection<EventDocument<Owner>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "TimeLapsing", private readonly clock: () => Date = () => new Date()) {
    // Keep the existing collection: update-only histories are the first draft.
    this.events = database.collection(`${name.toLowerCase()}.updates`);
  }

  /** Initialize constraints once; a failed initialization can be retried. */
  #ready() {
    this.indexes ??= this.events.createIndexes([
      { key: { owner: 1, key: 1 }, unique: true },
      { key: { owner: 1, sequence: 1 }, unique: true },
      { key: { owner: 1, kind: 1, index: 1 } },
      { key: { owner: 1, index: 1 }, unique: true, partialFilterExpression: { kind: "completion" } },
    ]).catch((error: unknown) => { this.indexes = undefined; throw error; });
    return this.indexes;
  }

  async addUpdate({ owner, key, sequence, change, timestamp }: { owner: Owner; key: string; sequence: number; change: string; timestamp: number }) {
    if (!uuid(key) || !Number.isSafeInteger(sequence) || sequence < 1
      || typeof change !== "string" || change.length === 0 || change.length > 524288
      || !Number.isSafeInteger(timestamp) || timestamp < 0) {
      throw new InvalidUpdate("The update is not valid.");
    }
    await this.#ready();
    const existing = await this.events.findOne({ owner, key });
    if (existing) return this.#retryUpdate(existing, change, timestamp);
    const last = await this.events.findOne({ owner }, { sort: { sequence: -1 } });
    if (sequence !== (last?.sequence ?? 0) + 1) throw new StaleHistory("Load the latest history before adding this update.");
    try {
      await this.events.insertOne({ owner, key, sequence, change, timestamp });
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      const retried = await this.events.findOne({ owner, key });
      if (retried) return this.#retryUpdate(retried, change, timestamp);
      throw new StaleHistory("Load the latest history before adding this update.");
    }
    return { sequence };
  }

  #retryUpdate(existing: EventDocument<Owner>, change: string, timestamp: number) {
    if (existing.kind === "completion" || existing.change !== change || existing.timestamp !== timestamp) {
      throw new UpdateKeyReused("This update identifier has already been used.");
    }
    return { sequence: existing.sequence };
  }

  async complete({ owner, key, sequence }: { owner: Owner; key: string; sequence: number }) {
    if (!uuid(key) || !Number.isSafeInteger(sequence) || sequence < 1) throw new InvalidCompletion("The completion is not valid.");
    await this.#ready();
    const existing = await this.events.findOne({ owner, key });
    if (existing) return this.#retryCompletion(existing, sequence);
    const last = await this.events.findOne({ owner }, { sort: { sequence: -1 } });
    if (sequence !== (last?.sequence ?? 0) + 1) throw new StaleHistory("Load the latest history before adding this update.");
    const previous = await this.events.findOne({ owner, kind: "completion", sequence: { $lt: sequence } }, { sort: { sequence: -1 } });
    const start = previous?.kind === "completion" ? previous.sequence : 0;
    const index = previous?.kind === "completion" ? previous.index + 1 : 1;
    if (sequence === start + 1) throw new EmptyHistory("There are no updates to complete.");
    try {
      // The unique sequence serializes completion against updates and other
      // completions. No deletes, copies, or multi-document transaction are needed.
      await this.events.insertOne({ owner, key, sequence, kind: "completion", index, start, count: sequence - start - 1, createdAt: this.clock().getTime() });
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      const retried = await this.events.findOne({ owner, key });
      if (retried) return this.#retryCompletion(retried, sequence);
      throw new StaleHistory("Load the latest history before adding this update.");
    }
    return { index, sequence };
  }

  #retryCompletion(existing: EventDocument<Owner>, sequence: number) {
    if (existing.kind !== "completion" || existing.sequence !== sequence) throw new UpdateKeyReused("This update identifier has already been used.");
    return { index: existing.index, sequence: existing.sequence };
  }

  async _history({ owner, after }: { owner: Owner; after: number }): Promise<{ start: number; updates: RecordedUpdate[] }> {
    await this.#ready();
    const last = await this.events.findOne({ owner }, { sort: { sequence: -1 } });
    const end = last?.sequence ?? 0;
    const completion = await this.events.findOne({ owner, kind: "completion", sequence: { $lte: end } }, { sort: { sequence: -1 } });
    const start = completion?.sequence ?? 0;
    const records = await this.events.find({ owner, sequence: { $gt: Math.max(cursor(after), start), $lte: end } })
      .sort({ sequence: 1 }).limit(50).toArray();
    return { start, updates: records.filter((record) => record.kind !== "completion").map(updateValue) };
  }

  async _recordings({ owner, after }: { owner: Owner; after: number }): Promise<{ recordings: { index: number; count: number; createdAt: number }[] }> {
    await this.#ready();
    const records = await this.events.find({ owner, kind: "completion", index: { $gt: cursor(after) } }).sort({ index: 1 }).limit(20).toArray();
    return { recordings: records.filter((record) => record.kind === "completion")
      .map(({ index, count, createdAt }) => ({ index, count, createdAt })) };
  }

  async _recording({ owner, index, after }: { owner: Owner; index: number; after: number }): Promise<{ found: boolean; updates: RecordedUpdate[] }> {
    if (!Number.isSafeInteger(index) || index < 1) return { found: false, updates: [] };
    await this.#ready();
    const recording = await this.events.findOne({ owner, kind: "completion", index });
    if (recording?.kind !== "completion") return { found: false, updates: [] };
    const records = await this.events.find({ owner, sequence: { $gt: Math.max(cursor(after), recording.start), $lt: recording.sequence } })
      .sort({ sequence: 1 }).limit(50).toArray();
    return { found: true, updates: records.filter((record) => record.kind !== "completion").map(updateValue) };
  }
}
