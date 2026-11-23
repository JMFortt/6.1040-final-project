/**
 * Weekly streaks: submitting a drawing engages the streak for the current Eastern Time
 * week, and reading the streak first expires one whose last active week is over.
 *
 * The week comes from the flow's instant, never from the request.
 */
import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { compute, now, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { computations, concepts } from "../../concepts.ts";

const { Sessioning, StreakTracking, TimeLapsing } = concepts;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const currentInput: EndpointValidator = (value) => isObject(value)
  && (value.session === null || typeof value.session === "string")
  && Object.keys(value).every((key) => key === "session")
  ? { ok: true } : { ok: false, detail: "Expected only a session." };

/** A completed drawing counts toward its owner's streak for this week. */
const SubmitEngagesStreak = reaction(({ owner, instant, week }) =>
  when(TimeLapsing.complete({ owner }).responds({}))
    .where(now(instant), compute(computations.easternWeek, { instant }, week))
    .then(StreakTracking.engage({ user: owner, period: week })),
);

/** The signed-in user's streak as of this week. */
const Current = endpoint("/streaks/current", ({ session, user, instant, week, streakCount }) => receive({ session })
  .then(Sessioning.use({ session }).responds({ subject: user }))
  .then(where(now(instant), compute(computations.easternWeek, { instant }, week))
    .then(StreakTracking.expire({ user, period: week }).responds({ streakCount }))
    .then(respond({ streakCount }))),
{ validators: { input: currentInput } });

export const composition = { SubmitEngagesStreak, Current };
