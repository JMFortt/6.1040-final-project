# Open questions

Unresolved on purpose. Add a dated note when the team decides. Do not edit `deliverables/` to close one of these unless a teammate asks.

## 2026-11-23 — StreakTracking + CoverageTracking (Julia)

Julia chose a **weekly** streak, with weeks running Monday 00:00 to Sunday 24:00 America/New_York. [`StreakTracking`](../design/concepts/StreakTracking.md) stays close to the F3 deliverable. The caller passes a period number, so the concept stays general, and the composition computes the Eastern Time week. Implemented on 2026-11-23 with the [streaks composition](../design/compositions/practice/streaks.md). There is no frontend yet; the dashboard is a usability-checkpoint item.

- The composition binds the flow's instant with `now(instant)` and converts it with the registered `easternWeek` computation (`src/practice/week.ts`), which uses the America/New_York calendar date, so weeks stay aligned across daylight saving changes. A computation must be declared in a `computations` fence in a registered design document, or `generate` fails with `MISSING_COVERAGE`.
- A reaction on `TimeLapsing.complete` calls `engage`. Nothing in the sync engine runs on a timer, so `/streaks/current` calls `expire` for the current week and responds with the count it returns.
- `assembleApplication` and the test helper `createApp` accept an optional `clock` so that tests can fix the current week.
- Differences from the F3 deliverable, which stays unchanged:
  - Periods replace days and are passed in, so `lastActiveDay` became `lastActivePeriod`.
  - The actions return the streak count and gain the refusals the executable format needs.
  - `engage` sets the count to 1 after a gap, so the count is right even when `expire` was not called first.
  - `expire` leaves a current streak unchanged instead of refusing, so it is safe to call before every read.
  - `_getStreak` returns 0 for a user who has never engaged.
- The checker rejects a `## Notes` section in concept specs. Record design rationale here or in the composition's design file.

The concept from Amina's spec is implemented and tested on its own (`src/concepts/CoverageTracking/`). It is instantiated with `Fundamental is FundamentalName`, a temporary concrete type for plain fundamental names. Rebind it to ReferencePhotoBinning's tag type when that concept exists.

- Each practice is one document holding its distinct fundamentals. That array realizes the spec's Exercises set, so recording a practice is one atomic insert.
- Still open: no reaction calls `record`, and no endpoint reads `_coverage`. Recording needs submissions to name their reference image and ReferencePhotoBinning to supply its fundamentals. Reading needs the list of fundamentals to report, which should also come from ReferencePhotoBinning. A temporary hard-coded list would be a team decision.

## 2026-11-22 — Sharing, following, and CoverageTracking design (Amina)

Decided from this handbook at Amina's request (her MVP row is posting and browsing), and open to team review. The rationale lives in the new design files: [`Posting`](../design/concepts/Posting.md), [`Following`](../design/concepts/Following.md), [`Liking`](../design/concepts/Liking.md), [`sharing/posts.md`](../design/compositions/sharing/posts.md), [`sharing/people.md`](../design/compositions/sharing/people.md).

- A post shares a completed timelapse until reference images are connected. Comments and reporting are deferred, because the ethics analysis ties them to moderation.
- `scripts/seed.ts` (`bun scripts/seed.ts`) adds five development artists with password `redraw-seed-123`. Never seed a deployed database.
- [`CoverageTracking`](../design/concepts/CoverageTracking.md) is a spec only, since Julia implements it at MVP. It keeps counts per artist and receives tags from a reaction, so it never reads ReferencePhotoBinning. That reaction needs submissions to record their reference image, which they do not yet.

## 2026-11-22 — numbered timelapse submissions

The team requested a Submit button that preserves strokes as a numbered timelapse, plus a private page after login listing saved timelapses in order. The index temporarily identifies a submission until reference images are connected. Playback belongs to TimeLapsing's existing purpose. The team clarified that **submission clears the working canvas**. Preserve completed histories immutably, number them per owner starting at 1, and begin a blank working history only after successful submission. A submission marker in the same ordered event log makes preservation and the new history boundary one atomic write. Existing unsubmitted strokes remain the first working history. Browser playback is included; video file export remains deferred.

## 2026-11-19 — account boilerplate

`bun run dev` runs ConceptBox’s Registering, Authenticating, Federating (Commons), and Sessioning, with the passwords and Commons sign-in compositions. Registering is included because the other three are parameterized on `Registering.User`. Redraw concepts from `deliverables/` are not instantiated.

Vue 3 and Vite are the frontend. Further dependencies still wait for a team decision (`AGENTS.md`).

## 2026-11-20 — requested drawing editor

The team requested a drawing page using **Easy-Brush**, with pressure-sensitive ink pens, textured brushes, an eraser, and database storage of strokes for future time-lapses. This request selects Easy-Brush as an additional dependency. Video generation is deferred by this request.

The existing TimeLapsing deliverable records a single stream without a drawing or owner identity. The team resolved this gap: **one persistent private canvas per signed-in artist**, with completed strokes autosaved and restored on return. The executable spec may therefore scope the ordered updates by an external owner identity. The deliverable remains unchanged.

Implementation scope: authenticate through Sessioning in compositions; keep TimeLapsing independent and parameterized by owner identity. Store ordered ink and eraser events with point coordinates, pressure, relative point times, brush settings, canvas dimensions, and a rendering version so future replay can reproduce the drawing. Use deterministic texture assets/settings so replay does not introduce different random marks. Keep save status visible and retain failed saves for retry. The current request does not add posting, reference selection, a practice timer, or video export.

## Behavior named in the journey, without a spec

F3 specifies ReferencePhotoBinning, CoverageTracking, TimeLapsing, and StreakTracking only.

Still unnamed as concept specs, but present in the solution sketch or the user journey:

- Register and return are covered by the account boilerplate. Redraw still has no product spec for posting, following, or the draw timer.
- Posting to a reference’s board
- Following, username search, feed filter
- A 30-minute draw timer and a one-minute wrap-up
- Save versus delete after a session

Do not invent these while building the four specified concepts.

## Spec spots that block a faithful translation

Ask before adding a Redraw concept to `design/` or changing a deliverable. A quiet repair would be a design change.

- **ReferencePhotoBinning.** `submitPhoto` requires an admin submitter, and the submitter is not an argument. `_requestPhoto` limits results to “the bank of the day, managed by the server,” and the state block has no day, no window, and no selection. The purpose says everyone in a time window shares one bank; the state is a single set of tagged images.
- **CoverageTracking.addImage** reads `FundamentalTags` off a `ReferenceImage`. Those tags are state of ReferencePhotoBinning. Passing the image id and then opening its fields couples the two concepts. A reaction can query the bank and pass tags or counts in, if the team wants that.
- **TimeLapsing — resolved for this iteration on 2026-11-20.** The team selected one persistent private canvas per artist. The executable spec scopes updates by owner and exposes paginated history; video rendering is deferred. The submitted `_render` outline remains unchanged.
- **StreakTracking.** The principle is “first engagement in 24 hours increments; a missed day resets.” `engage` also says the new day must be one higher than the previous. `expire` is a separate action. Day boundaries (midnight versus rolling 24 hours) are not defined. The state field is a `Number`.

## Stack and policy not chosen yet

- Vue 3 and Vite are the frontend. Further dependencies still wait for a team decision (`AGENTS.md`).
- AI for collecting or tagging images is deferred past the first checkpoint. Hand-tagged public-domain images until that decision.
- The boilerplate offers both a password and Commons sign-in, copied from ConceptBox. Which of those Redraw keeps is still open.
- Canvas approach selected on 2026-11-20: Easy-Brush 0.5.0, with a versioned renderer and deterministic tips. Keep the renderer version when changing rendering behavior so saved strokes remain reproducible.

## Primary oversight

Owners in the development plan change at each checkpoint (design draft, MVP, usability, then a shared ticket list). Read that table before assuming who is watching a concept. Everyone still takes part in framing, design, and implementation.
