/**
 * The signed-in artist's coverage: one row for each of Redraw's fundamentals,
 * least practiced first. Practices are recorded when an artwork is saved; see practicing.ts.
 */
import { endpoint, receive, respond, type EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { compute, each, form, former, where } from "@mit-sdg/sync-engine/language";
import { computations, concepts } from "../../concepts.ts";

const { CoverageTracking, Sessioning } = concepts;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const sessionInput: EndpointValidator = (value) => isObject(value)
  && (value.session === null || typeof value.session === "string")
  && Object.keys(value).every((key) => key === "session")
  ? { ok: true } : { ok: false, detail: "Expected only a session." };

/** One row per fundamental, in CoverageTracking._coverage's order: least practiced first, then by name. */
const CoverageRows = former("the coverage of (artist) over (fundamentals)", ({ artist, fundamentals }, { fundamental, count }) =>
  form({
    rows: each(CoverageTracking._coverage({ artist, fundamentals }).is({ fundamental, count }))
      .form({ fundamental, count }),
  }),
);

const Current = endpoint("/coverage/current", ({ session, artist, fundamentals }) => receive({ session })
  .then(Sessioning.use({ session }).responds({ subject: artist }))
  .then(where(compute(computations.coverageFundamentals, {}, fundamentals))
    .then(respond({ coverage: CoverageRows({ artist, fundamentals }) }))),
{ validators: { input: sessionInput } });

export const composition = { CoverageRows, Current };
