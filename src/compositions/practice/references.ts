/**
 * The shared reference bank. A session's user appoints curators and edits photos.
 * Any signed-in user asks for one fundamental and receives the photo assigned to
 * it for the current Eastern Time day. The request never names a user or a day.
 */
import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { compute, no, now, where } from "@mit-sdg/sync-engine/language";
import { computations, concepts } from "../../concepts.ts";

const { ReferencePhotoBinning, Registering, Sessioning } = concepts;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const session = (value: unknown) => value === null || typeof value === "string";
const only = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((key) => keys.includes(key));
const username = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_-]{3,32}$/.test(value);
const keyOf = (value: unknown) => typeof value === "string" && value.length >= 1 && value.length <= 80;
const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length >= 1 && value.trim().length <= max;
const tagsOf = (value: unknown, empty: boolean) => Array.isArray(value)
  && value.length >= (empty ? 0 : 1) && value.length <= 8
  && value.every((tag) => text(tag, 40));

const appointInput: EndpointValidator = (value) => isObject(value) && session(value.session) && username(value.username) && only(value, ["session", "username"])
  ? { ok: true } : { ok: false, detail: "Expected a username to appoint." };
const addInput: EndpointValidator = (value) => isObject(value) && session(value.session) && keyOf(value.key)
  && text(value.source, 2048) && text(value.credit, 300) && tagsOf(value.tags, false)
  && only(value, ["session", "key", "source", "credit", "tags"])
  ? { ok: true } : { ok: false, detail: "Expected a key, source, credit, and one to eight tags." };
const imageInput: EndpointValidator = (value) => isObject(value) && session(value.session) && keyOf(value.image) && only(value, ["session", "image"])
  ? { ok: true } : { ok: false, detail: "Expected a reference image." };
const tagInput: EndpointValidator = (value) => isObject(value) && session(value.session) && keyOf(value.image) && tagsOf(value.tags, false)
  && only(value, ["session", "image", "tags"])
  ? { ok: true } : { ok: false, detail: "Expected a reference image and one to eight tags." };
const requestInput: EndpointValidator = (value) => isObject(value) && session(value.session) && text(value.fundamental, 40) && only(value, ["session", "fundamental"])
  ? { ok: true } : { ok: false, detail: "Expected one fundamental." };

const Appoint = endpoint("/references/appoint", ({ session, admin, username, curator }) => receive({ session, username })
  .then(Sessioning.use({ session }).responds({ subject: admin }))
  .then(
    where(Registering._byUsername({ username }).is({ user: curator }))
      .then(ReferencePhotoBinning.appoint({ admin, curator }).responds({}))
      .then(respond({}))
      .named("known"),
    where(no(Registering._byUsername({ username })))
      .then(respond({ error: "USER_NOT_FOUND" }))
      .named("unknown"),
  ),
{ validators: { input: appointInput } });

const Add = endpoint("/references/add", ({ session, admin, key, source, credit, tags, image }) => receive({ session, key, source, credit, tags })
  .then(Sessioning.use({ session }).responds({ subject: admin }))
  .then(ReferencePhotoBinning.add({ admin, key, source, credit, tags }).responds({ image }))
  .then(respond({ image })),
{ validators: { input: addInput } });

const Remove = endpoint("/references/remove", ({ session, admin, image }) => receive({ session, image })
  .then(Sessioning.use({ session }).responds({ subject: admin }))
  .then(ReferencePhotoBinning.remove({ admin, image }).responds({}))
  .then(respond({})),
{ validators: { input: imageInput } });

const Tag = endpoint("/references/tag", ({ session, admin, image, tags }) => receive({ session, image, tags })
  .then(Sessioning.use({ session }).responds({ subject: admin }))
  .then(ReferencePhotoBinning.tag({ admin, image, tags }).responds({}))
  .then(respond({})),
{ validators: { input: tagInput } });

const Request = endpoint("/references/request", ({ session, instant, day, fundamental, found, image, source, credit }) => receive({ session, fundamental })
  .then(Sessioning.use({ session }).responds({}))
  .then(where(now(instant), compute(computations.easternDay, { instant }, day))
    .then(ReferencePhotoBinning.request({ day, fundamental }).responds({ found, image, source, credit }))
    .then(respond({ found, image, source, credit }))),
{ validators: { input: requestInput } });

/** HTTP categories for the refusals these endpoints expose. */
export const referencesHttp = {
  publicErrors: {
    FIRST_CURATOR: "FORBIDDEN",
    NOT_CURATOR: "FORBIDDEN",
    ALREADY_CURATOR: "CONFLICT",
    INVALID_IMAGE: "INVALID_REQUEST",
    IMAGE_KEY_REUSED: "CONFLICT",
    SOURCE_REUSED: "CONFLICT",
    IMAGE_NOT_FOUND: "NOT_FOUND",
    USER_NOT_FOUND: "NOT_FOUND",
  },
} as const;

export const composition = { Appoint, Add, Remove, Tag, Request };
