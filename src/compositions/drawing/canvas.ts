import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../../concepts.ts";
import { parseStroke } from "../../drawing/stroke.ts";

const { Sessioning, TimeLapsing } = concepts;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const session = (value: unknown) => value === null || typeof value === "string";

const historyInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && Number.isSafeInteger(value.after) && Number(value.after) >= 0
  && Object.keys(value).every((key) => ["session", "after"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected a history cursor." };

const strokeInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && typeof value.key === "string" && Number.isSafeInteger(value.sequence) && Number(value.sequence) > 0
  && Number.isSafeInteger(value.timestamp) && Number(value.timestamp) >= 0 && parseStroke(value.change) !== null
  && Object.keys(value).every((key) => ["session", "key", "sequence", "timestamp", "change"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected a supported stroke with valid points and settings." };

const submitInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && typeof value.key === "string" && Number.isSafeInteger(value.sequence) && Number(value.sequence) > 0
  && Object.keys(value).every((key) => ["session", "key", "sequence"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected a submission key and sequence." };

const timelapseInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && Number.isSafeInteger(value.index) && Number(value.index) > 0
  && Number.isSafeInteger(value.after) && Number(value.after) >= 0
  && Object.keys(value).every((key) => ["session", "index", "after"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected a timelapse index and cursor." };

const History = endpoint("/canvas/history", ({ session, owner, after, start, updates }) => receive({ session, after })
  .then(Sessioning.use({ session }).responds({ subject: owner }))
  .then(where(TimeLapsing._history({ owner, after }).is({ start, updates })).then(respond({ start, updates }))),
{ validators: { input: historyInput } });

const Stroke = endpoint("/canvas/stroke", ({ session, owner, key, sequence, change, timestamp, saved }) =>
  receive({ session, key, sequence, change, timestamp })
    .then(Sessioning.use({ session }).responds({ subject: owner }))
    .then(TimeLapsing.addUpdate({ owner, key, sequence, change, timestamp }).responds({ sequence: saved }))
    .then(respond({ sequence: saved })),
{ validators: { input: strokeInput } });

const Submit = endpoint("/canvas/submit", ({ session, owner, key, sequence, index, saved }) => receive({ session, key, sequence })
  .then(Sessioning.use({ session }).responds({ subject: owner }))
  .then(TimeLapsing.complete({ owner, key, sequence }).responds({ index, sequence: saved }))
  .then(respond({ index, sequence: saved })),
{ validators: { input: submitInput } });

const Timelapses = endpoint("/canvas/timelapses", ({ session, owner, after, recordings }) => receive({ session, after })
  .then(Sessioning.use({ session }).responds({ subject: owner }))
  .then(where(TimeLapsing._recordings({ owner, after }).is({ recordings })).then(respond({ recordings }))),
{ validators: { input: historyInput } });

const Timelapse = endpoint("/canvas/timelapse", ({ session, owner, index, after, found, updates }) => receive({ session, index, after })
  .then(Sessioning.use({ session }).responds({ subject: owner }))
  .then(where(TimeLapsing._recording({ owner, index, after }).is({ found, updates })).then(respond({ found, updates }))),
{ validators: { input: timelapseInput } });

/** HTTP categories for the refusals exposed by the canvas endpoints. */
export const canvasHttp = {
  publicErrors: {
    INVALID_UPDATE: "INVALID_REQUEST",
    STALE_HISTORY: "CONFLICT",
    UPDATE_KEY_REUSED: "INVALID_REQUEST",
    INVALID_COMPLETION: "INVALID_REQUEST",
    EMPTY_HISTORY: "INVALID_REQUEST",
  },
} as const;

export const composition = { History, Stroke, Submit, Timelapses, Timelapse };
