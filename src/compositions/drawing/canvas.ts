import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../../concepts.ts";
import { webp } from "../../drawing/picture.ts";
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

const revisionInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && typeof value.key === "string" && Number.isSafeInteger(value.sequence) && Number(value.sequence) > 0
  && Number.isSafeInteger(value.timestamp) && Number(value.timestamp) >= 0
  && Object.keys(value).every((key) => ["session", "key", "sequence", "timestamp"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected an undo or redo key and sequence." };

const submitInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && typeof value.key === "string" && Number.isSafeInteger(value.sequence) && Number(value.sequence) > 0
  && webp(value.image) !== null
  && Object.keys(value).every((key) => ["session", "key", "sequence", "image"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected a submission key, sequence, and WebP picture." };

const pictureInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && Number.isSafeInteger(value.index) && Number(value.index) > 0
  && Object.keys(value).every((key) => ["session", "index"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected a timelapse index." };

const timelapseInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && Number.isSafeInteger(value.index) && Number(value.index) > 0
  && Number.isSafeInteger(value.after) && Number(value.after) >= 0
  && Object.keys(value).every((key) => ["session", "index", "after"].includes(key))
  ? { ok: true } : { ok: false, detail: "Expected a timelapse index and cursor." };

const History = endpoint("/canvas/history", ({ session, owner, after, start, tip, updates, redo }) => receive({ session, after })
  .then(Sessioning.use({ session }).responds({ subject: owner }))
  .then(where(TimeLapsing._history({ owner, after }).is({ start, tip, updates, redo })).then(respond({ start, tip, updates, redo }))),
{ validators: { input: historyInput } });

const Stroke = endpoint("/canvas/stroke", ({ session, owner, key, sequence, change, timestamp, saved }) =>
  receive({ session, key, sequence, change, timestamp })
    .then(Sessioning.use({ session }).responds({ subject: owner }))
    .then(TimeLapsing.addUpdate({ owner, key, sequence, change, timestamp }).responds({ sequence: saved }))
    .then(respond({ sequence: saved })),
{ validators: { input: strokeInput } });

const Undo = endpoint("/canvas/undo", ({ session, owner, key, sequence, timestamp, saved, removed }) =>
  receive({ session, key, sequence, timestamp })
    .then(Sessioning.use({ session }).responds({ subject: owner }))
    .then(TimeLapsing.undo({ owner, key, sequence, timestamp }).responds({ sequence: saved, removed }))
    .then(respond({ sequence: saved, removed })),
{ validators: { input: revisionInput } });

const Redo = endpoint("/canvas/redo", ({ session, owner, key, sequence, timestamp, saved, restored, change, occurred }) =>
  receive({ session, key, sequence, timestamp })
    .then(Sessioning.use({ session }).responds({ subject: owner }))
    .then(TimeLapsing.redo({ owner, key, sequence, timestamp }).responds({ sequence: saved, key: restored, change, timestamp: occurred }))
    .then(respond({ sequence: saved, key: restored, change, timestamp: occurred })),
{ validators: { input: revisionInput } });

const Submit = endpoint("/canvas/submit", ({ session, owner, key, sequence, image, index, saved }) => receive({ session, key, sequence, image })
  .then(Sessioning.use({ session }).responds({ subject: owner }))
  .then(TimeLapsing.complete({ owner, key, sequence, image }).responds({ index, sequence: saved }))
  .then(respond({ index, sequence: saved })),
{ validators: { input: submitInput } });

const Picture = endpoint("/canvas/picture", ({ session, owner, index, found, image }) => receive({ session, index })
  .then(Sessioning.use({ session }).responds({ subject: owner }))
  .then(where(TimeLapsing._picture({ owner, index }).is({ found, image })).then(respond({ found, image }))),
{ validators: { input: pictureInput } });

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
    NOTHING_TO_UNDO: "INVALID_REQUEST",
    NOTHING_TO_REDO: "INVALID_REQUEST",
  },
} as const;

export const composition = { History, Stroke, Undo, Redo, Submit, Picture, Timelapses, Timelapse };
