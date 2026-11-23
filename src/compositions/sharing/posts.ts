/**
 * Sharing completed timelapses: publishing, retracting, browsing the feed, and
 * replaying a posted timelapse.
 *
 * Every endpoint resolves the acting user through Sessioning first. A request
 * never names an author or an owner; a viewer reaches another artist's strokes
 * only through a post that exists.
 */
import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, no, reaction, when, where, whether } from "@mit-sdg/sync-engine/language";
import { concepts } from "../../concepts.ts";

const { Liking, Following, Posting, Registering, Sessioning, TimeLapsing } = concepts;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const session = (value: unknown) => value === null || typeof value === "string";
const only = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((key) => keys.includes(key));
const index = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;
const cursor = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
const postId = (value: unknown) => typeof value === "string" && /^[\da-f]{24}$/.test(value);

const publishInput: EndpointValidator = (value) => isObject(value) && session(value.session) && index(value.index) && only(value, ["session", "index"])
  ? { ok: true } : { ok: false, detail: "Expected a timelapse index." };
const postInput: EndpointValidator = (value) => isObject(value) && session(value.session) && postId(value.post) && only(value, ["session", "post"])
  ? { ok: true } : { ok: false, detail: "Expected a post." };
const feedInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && (value.before === "" || postId(value.before)) && only(value, ["session", "before"])
  ? { ok: true } : { ok: false, detail: "Expected a feed cursor." };
const timelapseInput: EndpointValidator = (value) => isObject(value) && session(value.session) && postId(value.post)
  && cursor(value.after) && only(value, ["session", "post", "after"])
  ? { ok: true } : { ok: false, detail: "Expected a post and a stroke cursor." };

/**
 * One feed page, newest first. Each row carries the author's current username, the like
 * count, and whether the viewer likes the post and follows its author.
 */
const FeedPage = former("the feed page before (before) for (viewer)", ({ before, viewer }, { post, author, work, createdAt, username, likes, liked, following }) =>
  form({
    posts: each(Posting._feed({ before }).is({ post, author, work, createdAt }))
      .where(
        whether(Registering._username({ user: author }).is({ username })),
        Liking._count({ item: post }).is({ count: likes }),
        Liking._likes({ person: viewer, item: post }).is({ liked }),
        Following._isFollowing({ follower: viewer, followee: author }).is({ following }),
      )
      .form({ post, username, index: work, createdAt, likes, liked, following }),
  }),
);

const Feed = endpoint("/posts/feed", ({ session, viewer, before }) => receive({ session, before })
  .then(Sessioning.use({ session }).responds({ subject: viewer }))
  .then(respond({ page: FeedPage({ before, viewer }) })),
{ validators: { input: feedInput } });

/** Only a completed timelapse of the signed-in artist can be published. */
const Publish = endpoint("/posts/publish", ({ session, author, index, post }) => receive({ session, index })
  .then(Sessioning.use({ session }).responds({ subject: author }))
  .then(
    where(TimeLapsing._recording({ owner: author, index, after: 0 }).is({ found: true }))
      .then(Posting.publish({ author, work: index }).responds({ post }))
      .then(respond({ post }))
      .named("recorded"),
    where(TimeLapsing._recording({ owner: author, index, after: 0 }).is({ found: false }))
      .then(respond({ error: "TIMELAPSE_NOT_FOUND" }))
      .named("missing"),
  ),
{ validators: { input: publishInput } });

/** Posting refuses a retraction by anyone but the author, so the rule holds for every caller. */
const Retract = endpoint("/posts/retract", ({ session, author, post, retracted }) => receive({ session, post })
  .then(Sessioning.use({ session }).responds({ subject: author }))
  .then(Posting.retract({ author, post }).responds({ post: retracted }))
  .then(respond({ post: retracted })),
{ validators: { input: postInput } });

/** A retracted post's likes are forgotten, so they cannot outlive it. */
const RetractForgetsLikes = reaction(({ post }) =>
  when(Posting.retract({}).responds({ post }))
    .then(Liking.forget({ item: post })),
);

/** Liking accepts any item, so requiring the post to exist is this application's decision. */
const Like = endpoint("/posts/like", ({ session, person, post }) => receive({ session, post })
  .then(Sessioning.use({ session }).responds({ subject: person }))
  .then(
    where(Posting._get({ post }))
      .then(Liking.like({ person, item: post }).responds({}))
      .then(respond({}))
      .named("posted"),
    where(no(Posting._get({ post })))
      .then(respond({ error: "POST_NOT_FOUND" }))
      .named("unposted"),
  ),
{ validators: { input: postInput } });

const Unlike = endpoint("/posts/unlike", ({ session, person, post }) => receive({ session, post })
  .then(Sessioning.use({ session }).responds({ subject: person }))
  .then(Liking.unlike({ person, item: post }).responds({}))
  .then(respond({})),
{ validators: { input: postInput } });

/** The signed-in artist's post of one of their timelapses, or null when it is not shared. */
const Status = endpoint("/posts/status", ({ session, author, index, post }) => receive({ session, index })
  .then(Sessioning.use({ session }).responds({ subject: author }))
  .then(where(whether(Posting._publishedAs({ author, work: index }).is({ post }))).then(respond({ post }))),
{ validators: { input: publishInput } });

/** A posted timelapse's stored picture, for any signed-in viewer. Unposted recordings stay private. */
const Picture = endpoint("/posts/picture", ({ session, viewer, post, author, work, found, image }) => receive({ session, post })
  .then(Sessioning.use({ session }).responds({ subject: viewer }))
  .then(
    where(
      Posting._get({ post }).is({ author, work }),
      TimeLapsing._picture({ owner: author, index: work }).is({ found, image }),
    ).then(respond({ found, image })).named("posted"),
    where(no(Posting._get({ post })))
      .then(respond({ found: false, image: "" }))
      .named("unposted"),
  ),
{ validators: { input: postInput } });

/** A posted timelapse's strokes, for any signed-in viewer. Unposted recordings stay private. */
const Timelapse = endpoint("/posts/timelapse", ({ session, viewer, post, after, author, work, createdAt, found, updates }) => receive({ session, post, after })
  .then(Sessioning.use({ session }).responds({ subject: viewer }))
  .then(
    where(
      Posting._get({ post }).is({ author, work, createdAt }),
      TimeLapsing._recording({ owner: author, index: work, after }).is({ found, updates }),
    ).then(respond({ found, updates, createdAt })).named("posted"),
    where(no(Posting._get({ post })))
      .then(respond({ found: false, updates: [], createdAt: 0 }))
      .named("unposted"),
  ),
{ validators: { input: timelapseInput } });

/** HTTP categories for the refusals these endpoints expose. */
export const postsHttp = {
  publicErrors: {
    ALREADY_PUBLISHED: "CONFLICT",
    POST_NOT_FOUND: "NOT_FOUND",
    TIMELAPSE_NOT_FOUND: "NOT_FOUND",
    ALREADY_LIKED: "CONFLICT",
    NOT_LIKED: "NOT_FOUND",
  },
} as const;

export const composition = { Feed, FeedPage, Publish, Retract, RetractForgetsLikes, Like, Unlike, Status, Picture, Timelapse };
