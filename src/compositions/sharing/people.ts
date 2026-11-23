/**
 * Following artists: follow and unfollow by username, list whom the signed-in artist
 * follows, and suggest active artists they do not follow yet.
 *
 * Requests name other artists by username, never by user id. The follower is always the
 * session's user.
 */
import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, no, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../../concepts.ts";

const { Following, Posting, Registering, Sessioning } = concepts;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const session = (value: unknown) => value === null || typeof value === "string";
const only = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((key) => keys.includes(key));

const usernameInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && typeof value.username === "string" && /^[A-Za-z0-9_-]{3,32}$/.test(value.username) && only(value, ["session", "username"])
  ? { ok: true } : { ok: false, detail: "Expected a username." };
const searchInput: EndpointValidator = (value) => isObject(value) && session(value.session)
  && typeof value.prefix === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(value.prefix) && only(value, ["session", "prefix"])
  ? { ok: true } : { ok: false, detail: "Expected 1 to 32 username characters." };
const sessionInput: EndpointValidator = (value) => isObject(value) && session(value.session) && only(value, ["session"])
  ? { ok: true } : { ok: false, detail: "Expected only a session." };

const Follow = endpoint("/people/follow", ({ session, follower, username, followee }) => receive({ session, username })
  .then(Sessioning.use({ session }).responds({ subject: follower }))
  .then(
    where(Registering._byUsername({ username }).is({ user: followee }))
      .then(Following.follow({ follower, followee }).responds({}))
      .then(respond({}))
      .named("known"),
    where(no(Registering._byUsername({ username })))
      .then(respond({ error: "USER_NOT_FOUND" }))
      .named("unknown"),
  ),
{ validators: { input: usernameInput } });

const Unfollow = endpoint("/people/unfollow", ({ session, follower, username, followee }) => receive({ session, username })
  .then(Sessioning.use({ session }).responds({ subject: follower }))
  .then(
    where(Registering._byUsername({ username }).is({ user: followee }))
      .then(Following.unfollow({ follower, followee }).responds({}))
      .then(respond({}))
      .named("known"),
    where(no(Registering._byUsername({ username })))
      .then(respond({ error: "USER_NOT_FOUND" }))
      .named("unknown"),
  ),
{ validators: { input: usernameInput } });

/** Everyone the viewer follows, most recent first, by username. */
const FollowingList = former("the people (follower) follows", ({ follower }, { followee, since, username }) =>
  form({
    people: each(Following._following({ follower }).is({ followee, since }))
      .where(Registering._username({ user: followee }).is({ username }))
      .form({ username, since }),
  }),
);

const Followed = endpoint("/people/following", ({ session, follower }) => receive({ session })
  .then(Sessioning.use({ session }).responds({ subject: follower }))
  .then(respond({ following: FollowingList({ follower }) })),
{ validators: { input: sessionInput } });

/** Recently active artists the viewer does not follow, excluding the viewer. */
const SuggestionList = former("artists to suggest to (viewer)", ({ viewer }, { author, posts, latest, username, followers, me }) =>
  form({
    people: each(Posting._authors({}).is({ author, posts, latest }))
      .where(
        Registering._username({ user: viewer }).is({ username: me }),
        Registering._username({ user: author }).is({ username }),
        Registering._username({ user: author }).is.not({ username: me }),
        Following._isFollowing({ follower: viewer, followee: author }).is({ following: false }),
        Following._followerCount({ followee: author }).is({ count: followers }),
      )
      .form({ username, posts, latest, followers }),
  }),
);

const Suggestions = endpoint("/people/suggestions", ({ session, viewer }) => receive({ session })
  .then(Sessioning.use({ session }).responds({ subject: viewer }))
  .then(respond({ suggestions: SuggestionList({ viewer }) })),
{ validators: { input: sessionInput } });

/** Artists whose username starts with the typed text, excluding the viewer, with whether the viewer follows them. */
const SearchResults = former("artists matching (prefix) for (viewer)", ({ prefix, viewer }, { user, username, following, followers, me }) =>
  form({
    people: each(Registering._search({ prefix }).is({ user, username }))
      .where(
        Registering._username({ user: viewer }).is({ username: me }),
        Registering._username({ user }).is.not({ username: me }),
        Following._isFollowing({ follower: viewer, followee: user }).is({ following }),
        Following._followerCount({ followee: user }).is({ count: followers }),
      )
      .form({ username, following, followers }),
  }),
);

const Search = endpoint("/people/search", ({ session, viewer, prefix }) => receive({ session, prefix })
  .then(Sessioning.use({ session }).responds({ subject: viewer }))
  .then(respond({ results: SearchResults({ prefix, viewer }) })),
{ validators: { input: searchInput } });

/** HTTP categories for the refusals these endpoints expose. */
export const peopleHttp = {
  publicErrors: {
    USER_NOT_FOUND: "NOT_FOUND",
    CANNOT_FOLLOW_SELF: "INVALID_REQUEST",
    ALREADY_FOLLOWING: "CONFLICT",
    NOT_FOLLOWING: "NOT_FOUND",
  },
} as const;

export const composition = { Follow, Unfollow, Followed, FollowingList, Suggestions, SuggestionList, Search, SearchResults };
