/**
 * One open practice per artist. Begin asks the reference bank for today's photo.
 * The clock starts on the first stroke, from the flow's instant, and a submission or
 * a discard ends the attempt.
 */
import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { compute, now, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { computations, concepts } from "../../concepts.ts";

const { CoverageTracking, Practicing, ReferencePhotoBinning, Sessioning, TimeLapsing } = concepts;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const session = (value: unknown) => value === null || typeof value === "string";
const only = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((key) => keys.includes(key));
const fundamental = (value: unknown) => typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 40;

const sessionInput: EndpointValidator = (value) => isObject(value) && session(value.session) && only(value, ["session"])
  ? { ok: true } : { ok: false, detail: "Expected only a session." };
const beginInput: EndpointValidator = (value) => isObject(value) && session(value.session) && fundamental(value.fundamental) && only(value, ["session", "fundamental"])
  ? { ok: true } : { ok: false, detail: "Expected one fundamental." };

const Current = endpoint("/practice/current", ({ session, artist, practicing, fundamental, image, source, credit, started, startedAt }) => receive({ session })
  .then(Sessioning.use({ session }).responds({ subject: artist }))
  .then(where(Practicing._current({ artist }).is({ practicing, fundamental, image, source, credit, started, startedAt }))
    .then(respond({ practicing, fundamental, image, source, credit, started, startedAt }))),
{ validators: { input: sessionInput } });

const Begin = endpoint("/practice/begin", ({ session, artist, instant, day, fundamental, image, source, credit, started, startedAt }) => receive({ session, fundamental })
  .then(Sessioning.use({ session }).responds({ subject: artist }))
  .then(where(now(instant), compute(computations.easternDay, { instant }, day))
    .then(ReferencePhotoBinning.request({ day, fundamental }).responds({ image, source, credit }))
    .then(Practicing.begin({ artist, fundamental, image, source, credit }).responds({ fundamental, image, source, credit, started, startedAt }))
    .then(respond({ fundamental, image, source, credit, started, startedAt }))),
{ validators: { input: beginInput } });

const Start = endpoint("/practice/start", ({ session, artist, instant, startedAt }) => receive({ session })
  .then(Sessioning.use({ session }).responds({ subject: artist }))
  .then(where(now(instant))
    .then(Practicing.start({ artist, instant }).responds({ startedAt }))
    .then(respond({ startedAt }))),
{ validators: { input: sessionInput } });

const Discard = endpoint("/practice/discard", ({ session, artist }) => receive({ session })
  .then(Sessioning.use({ session }).responds({ subject: artist }))
  .then(TimeLapsing.abandon({ owner: artist }).responds({}))
  .then(Practicing.end({ artist }).responds({}))
  .then(respond({})),
{ validators: { input: sessionInput } });

/**
 * Saving the artwork counts the practice toward the chosen fundamental, then ends the practice,
 * so the next visit starts from the fundamental list. The attempt is read before it ends, and the
 * completion key makes a retried submission count once.
 */
const SubmitRecordsPractice = reaction(({ owner, key, fundamental, fundamentals }) =>
  when(TimeLapsing.complete({ owner, key }).responds({}))
    .where(
      Practicing._current({ artist: owner }).is({ practicing: true, fundamental }),
      compute(computations.fundamentalSet, { fundamental }, fundamentals),
    )
    .then(CoverageTracking.record({ artist: owner, key, fundamentals }).responds({}))
    .then(Practicing.end({ artist: owner })),
);

export const practicingHttp = {
  publicErrors: {
    INVALID_ATTEMPT: "INVALID_REQUEST",
    NOT_PRACTICING: "CONFLICT",
  },
} as const;

export const composition = { Current, Begin, Start, Discard, SubmitRecordsPractice };
