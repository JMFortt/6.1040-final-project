import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidUpdate extends Error {}
export class UpdateKeyReused extends Error {}
export class StaleHistory extends Error {}
export class InvalidCompletion extends Error {}
export class EmptyHistory extends Error {}
export class NothingToUndo extends Error {}
export class NothingToRedo extends Error {}

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
  image: string;
}
interface RevisionDocument<Owner> {
  owner: Owner;
  kind: "undo" | "redo";
  key: string;
  sequence: number;
  timestamp: number;
}
type EventDocument<Owner> = UpdateDocument<Owner> | CompletionDocument<Owner> | RevisionDocument<Owner>;
const uuid = (value: unknown) => typeof value === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
const MAX_IMAGE = 2_097_152;
const cursor = (value: number) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const updateValue = ({ key, sequence, change, timestamp }: RecordedUpdate): RecordedUpdate => ({ key, sequence, change, timestamp });
const isStroke = (event: { kind?: string; change?: string }): event is RecordedUpdate => event.kind !== "completion" && event.kind !== "undo" && event.kind !== "redo";

/** The drawing is the fold of one history: strokes push, undo lifts, redo restores, and a new stroke drops the redo. */
function fold<Owner>(events: readonly EventDocument<Owner>[]): { effective: RecordedUpdate[]; redo: RecordedUpdate[] } {
  const effective: RecordedUpdate[] = [];
  const redo: RecordedUpdate[] = [];
  for (const event of events) {
    if (event.kind === "undo") {
      const stroke = effective.pop();
      if (stroke) redo.push(stroke);
    } else if (event.kind === "redo") {
      const stroke = redo.pop();
      if (stroke) effective.push(stroke);
    } else if (isStroke(event)) {
      effective.push(updateValue(event));
      redo.length = 0;
    }
  }
  return { effective, redo };
}

/** Preserves independent, ordered recordings as immutable ranges of one event log. */
export class TimeLapsingConcept<Owner extends string> {
  private readonly events: Collection<EventDocument<Owner>>;
  private indexes: Promise<unknown> | undefined;
  /** Completed recordings never change, so repeated pages reuse one fold instead of rereading the log. */
  private readonly foldedRecordings = new Map<string, RecordedUpdate[]>();

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

  async #bounds(owner: Owner): Promise<{ start: number; tip: number }> {
    const last = await this.events.findOne({ owner }, { sort: { sequence: -1 } });
    const tip = last?.sequence ?? 0;
    const completion = await this.events.findOne({ owner, kind: "completion", sequence: { $lte: tip } }, { sort: { sequence: -1 } });
    return { start: completion?.kind === "completion" ? completion.sequence : 0, tip };
  }

  async #folded(owner: Owner, start: number, through: number) {
    const records = await this.events.find({ owner, sequence: { $gt: start, $lte: through } }).sort({ sequence: 1 }).toArray();
    return fold(records);
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
    if (!isStroke(existing) || existing.change !== change || existing.timestamp !== timestamp) {
      throw new UpdateKeyReused("This update identifier has already been used.");
    }
    return { sequence: existing.sequence };
  }

  async complete({ owner, key, sequence, image }: { owner: Owner; key: string; sequence: number; image: string }) {
    if (!uuid(key) || !Number.isSafeInteger(sequence) || sequence < 1 || typeof image !== "string" || image.length === 0 || image.length > MAX_IMAGE) {
      throw new InvalidCompletion("The completion is not valid.");
    }
    await this.#ready();
    const existing = await this.events.findOne({ owner, key });
    if (existing) return this.#retryCompletion(existing, sequence, image);
    const last = await this.events.findOne({ owner }, { sort: { sequence: -1 } });
    if (sequence !== (last?.sequence ?? 0) + 1) throw new StaleHistory("Load the latest history before adding this update.");
    const previous = await this.events.findOne({ owner, kind: "completion", sequence: { $lt: sequence } }, { sort: { sequence: -1 } });
    const start = previous?.kind === "completion" ? previous.sequence : 0;
    const index = previous?.kind === "completion" ? previous.index + 1 : 1;
    const { effective } = await this.#folded(owner, start, sequence - 1);
    if (effective.length === 0) throw new EmptyHistory("There are no updates to complete.");
    try {
      // The unique sequence serializes completion against updates and other
      // completions. No deletes, copies, or multi-document transaction are needed.
      await this.events.insertOne({ owner, key, sequence, kind: "completion", index, start, count: effective.length, image, createdAt: this.clock().getTime() });
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      const retried = await this.events.findOne({ owner, key });
      if (retried) return this.#retryCompletion(retried, sequence, image);
      throw new StaleHistory("Load the latest history before adding this update.");
    }
    return { index, sequence };
  }

  #retryCompletion(existing: EventDocument<Owner>, sequence: number, image: string) {
    if (existing.kind !== "completion" || existing.sequence !== sequence || existing.image !== image) throw new UpdateKeyReused("This update identifier has already been used.");
    return { index: existing.index, sequence: existing.sequence };
  }

  async undo({ owner, key, sequence, timestamp }: { owner: Owner; key: string; sequence: number; timestamp: number }) {
    if (!uuid(key) || !Number.isSafeInteger(sequence) || sequence < 1 || !Number.isSafeInteger(timestamp) || timestamp < 0) {
      throw new InvalidUpdate("The update is not valid.");
    }
    await this.#ready();
    const existing = await this.events.findOne({ owner, key });
    if (existing) return this.#retryUndo(owner, existing, timestamp);
    const { start, tip } = await this.#bounds(owner);
    if (sequence !== tip + 1) throw new StaleHistory("Load the latest history before adding this update.");
    const removed = (await this.#folded(owner, start, tip)).effective.at(-1);
    if (!removed) throw new NothingToUndo("There is no stroke to undo.");
    try {
      await this.events.insertOne({ owner, key, sequence, kind: "undo", timestamp });
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      const retried = await this.events.findOne({ owner, key });
      if (retried) return this.#retryUndo(owner, retried, timestamp);
      throw new StaleHistory("Load the latest history before adding this update.");
    }
    return { sequence, removed: removed.key };
  }

  async #retryUndo(owner: Owner, existing: EventDocument<Owner>, timestamp: number) {
    if (existing.kind !== "undo" || existing.timestamp !== timestamp) throw new UpdateKeyReused("This update identifier has already been used.");
    const removed = await this.#moved(owner, existing.sequence, "undo");
    return { sequence: existing.sequence, removed: removed.key };
  }

  async redo({ owner, key, sequence, timestamp }: { owner: Owner; key: string; sequence: number; timestamp: number }) {
    if (!uuid(key) || !Number.isSafeInteger(sequence) || sequence < 1 || !Number.isSafeInteger(timestamp) || timestamp < 0) {
      throw new InvalidUpdate("The update is not valid.");
    }
    await this.#ready();
    const existing = await this.events.findOne({ owner, key });
    if (existing) return this.#retryRedo(owner, existing, timestamp);
    const { start, tip } = await this.#bounds(owner);
    if (sequence !== tip + 1) throw new StaleHistory("Load the latest history before adding this update.");
    const restored = (await this.#folded(owner, start, tip)).redo.at(-1);
    if (!restored) throw new NothingToRedo("There is no stroke to redo.");
    try {
      await this.events.insertOne({ owner, key, sequence, kind: "redo", timestamp });
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      const retried = await this.events.findOne({ owner, key });
      if (retried) return this.#retryRedo(owner, retried, timestamp);
      throw new StaleHistory("Load the latest history before adding this update.");
    }
    return { sequence, key: restored.key, change: restored.change, timestamp: restored.timestamp };
  }

  async #retryRedo(owner: Owner, existing: EventDocument<Owner>, timestamp: number) {
    if (existing.kind !== "redo" || existing.timestamp !== timestamp) throw new UpdateKeyReused("This update identifier has already been used.");
    const restored = await this.#moved(owner, existing.sequence, "redo");
    return { sequence: existing.sequence, key: restored.key, change: restored.change, timestamp: restored.timestamp };
  }

  /** Drops the unfinished recording. Completed recordings stay, and a second call finds nothing to remove. */
  async abandon({ owner }: { owner: Owner }) {
    await this.#ready();
    const { start } = await this.#bounds(owner);
    await this.events.deleteMany({ owner, sequence: { $gt: start } });
    return {};
  }

  /** The stroke an undo removed, or a redo restored, is the top of that stack just before the event. */
  async #moved(owner: Owner, sequence: number, kind: "undo" | "redo") {
    const previous = await this.events.findOne({ owner, kind: "completion", sequence: { $lt: sequence } }, { sort: { sequence: -1 } });
    const start = previous?.kind === "completion" ? previous.sequence : 0;
    const stacks = await this.#folded(owner, start, sequence - 1);
    const stroke = kind === "undo" ? stacks.effective.at(-1) : stacks.redo.at(-1);
    if (!stroke) throw new UpdateKeyReused("This update identifier has already been used.");
    return stroke;
  }

  async _history({ owner, after }: { owner: Owner; after: number }): Promise<{ start: number; tip: number; updates: RecordedUpdate[]; redo: number }> {
    await this.#ready();
    const { start, tip } = await this.#bounds(owner);
    const { effective, redo } = await this.#folded(owner, start, tip);
    return { start, tip, updates: effective.filter((update) => update.sequence > cursor(after)).slice(0, 50), redo: redo.length };
  }

  async _picture({ owner, index }: { owner: Owner; index: number }): Promise<{ found: boolean; image: string }> {
    if (!Number.isSafeInteger(index) || index < 1) return { found: false, image: "" };
    await this.#ready();
    const recording = await this.events.findOne({ owner, kind: "completion", index });
    if (recording?.kind !== "completion" || typeof recording.image !== "string" || recording.image.length === 0) return { found: false, image: "" };
    return { found: true, image: recording.image };
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
    const effective = await this.#recordingStrokes(owner, recording);
    return { found: true, updates: effective.filter((update) => update.sequence > cursor(after)).slice(0, 50) };
  }

  async #recordingStrokes(owner: Owner, recording: CompletionDocument<Owner>) {
    const key = `${owner}:${recording.sequence}`;
    const hit = this.foldedRecordings.get(key);
    if (hit) {
      this.foldedRecordings.delete(key);
      this.foldedRecordings.set(key, hit);
      return hit;
    }
    const { effective } = await this.#folded(owner, recording.start, recording.sequence - 1);
    if (this.foldedRecordings.size >= 4) {
      const oldest = this.foldedRecordings.keys().next().value;
      if (oldest !== undefined) this.foldedRecordings.delete(oldest);
    }
    this.foldedRecordings.set(key, effective);
    return effective;
  }
}
