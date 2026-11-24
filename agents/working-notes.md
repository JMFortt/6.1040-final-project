# Open questions

Unresolved on purpose. Add a dated note when the team decides. Do not edit `deliverables/` to close one of these unless a teammate asks.

## 2026-11-23 — drawing session

The team asked for a practice on the Draw tab. The F3 journey's 30-minute timer and one-minute wrap-up are not what this version does.

- Before an attempt, the drawing surface is blurred and the artist picks one of anatomy, perspective, color, lighting, or form. Home's Start Daily Practice opens that same page. The header no longer has that button.
- Choosing a fundamental asks the reference bank for today's photo and stores the attempt. The 15-minute clock is shown immediately and starts when the first stroke is drawn. The start instant is stored on the attempt, so leaving the page or closing the app continues the same countdown.
- Save artwork completes the recording, which ends the attempt. Discard removes the unfinished drawing and ends the attempt; it does not add an artwork. Either way the page returns to the fundamental list.
- When the 15 minutes are up, new strokes and the tool bar stop. Panning and moving between pages stay available. Save and Discard are on the bar for the whole attempt, including before the clock runs out.
- CoverageTracking is still not recorded from a submission.

## 2026-11-23 — reference bank

ReferencePhotoBinning is an executable concept. The F3 deliverable is unchanged. Its two gaps are resolved as follows.

- The curator is an argument. `appoint` records who may add, remove, and tag. The first curator appoints themself; a curator appoints the next. The concept refuses anyone else. The composition takes the curator from the session and resolves a username through Registering.
- A request names one fundamental. The composition computes the Eastern Time calendar day with `easternDay` and passes it in, the same way streaks pass a week, so the concept still has no clock. The first request of a day assigns one photo to every fundamental that has one. Everyone who asks for that fundamental that day receives the stored photo. Assignment prefers the photo used least recently, and breaks ties at random. A photo already assigned to another fundamental today is skipped, unless it is the only photo tagged with the requested fundamental. Fundamentals are filled in alphabetical order. The assignment stays until that photo is removed or loses the tag.
- A photo stores a source string and a credit, not the file bytes. The source is whatever text the curator supplies, such as a URL. One to eight tags, a key of at most 80 characters, a source of at most 2048, and a credit of at most 300.
- The curated sample is 17 Wikimedia Commons photos, saved under `web/public/references/` at the Commons rendition nearest 1000 pixels (960 on the long side for landscape; the next available rendition for a few portraits). Credits are the author and license from each Commons page. Server startup calls `provide` for any catalog key this database has not already been introduced to. A curator can edit or remove those photos afterward, and a restart does not put a removed photo back. `provide` is not an endpoint.
- Curators manage the bank on the References page: an image address, a credit, and checkboxes for anatomy, color, form, lighting, and perspective. Composition and proportions are not offered. The page reads `_catalog`, which does not assign the day's photo.
- The reaction that would record CoverageTracking when a drawing is finished is still deferred. `TimeLapsing.complete` does not name a reference image, so there is nothing to pass.

## 2026-11-23 — timelapse picture

A completion stores the picture of that recording as an opaque string. The drawing composition accepts only a WebP, at most 1.5 MB, produced in the browser from the 1200 × 900 raster and composited over white. It is not a capture of the screen. Recordings completed before this have no picture. The feed shows the stored picture for the finished drawing and still loads strokes only to watch the process.

## 2026-11-23 — undo and redo

Undo and redo are events on the same TimeLapsing log. Folding that log yields the drawing: a stroke pushes and clears the redo stack, undo lifts the latest stroke onto it, and redo puts that stroke back. The working canvas and a submitted recording show only the strokes still on the drawing. Ctrl+Z undoes and Ctrl+Y redoes, after the current gesture and any pending strokes have saved.

## 2026-11-23 — StreakTracking + CoverageTracking (Julia)

Julia chose a **weekly** streak, with weeks running Monday 00:00 to Sunday 24:00 America/New_York. [`StreakTracking`](../design/concepts/StreakTracking.md) stays close to the F3 deliverable. The caller passes a period number, so the concept stays general, and the composition computes the Eastern Time week. Implemented on 2026-11-23 with the [streaks composition](../design/compositions/practice/streaks.md). Home shows the streak beside the practice button.

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

The concept from Amina's spec is implemented (`src/concepts/CoverageTracking/`). It and ReferencePhotoBinning share the `FundamentalName` concrete type.

- Each practice is one document holding its distinct fundamentals. That array realizes the spec's Exercises set, so recording a practice is one atomic insert.
- Wired up on 2026-11-23. Julia decided:
  - **Only the chosen fundamental counts**, not every tag on the reference photo.
  - **Coverage reports a fixed list**: anatomy, color, form, lighting, perspective (`src/practice/fundamentals.ts`).
  - Lucy's `SubmitEndsPractice` became **`SubmitRecordsPractice`**, one ordered chain: read `Practicing._current`, then `CoverageTracking.record` keyed by the completion key, then `Practicing.end`. Separate reactions would have raced to read the attempt before it ended.
- `/coverage/current` returns one row per fundamental, least practiced first. Home's Fundamentals card reads it; the sample data is gone.
- The frontend still repeats the five fundamentals in `DrawingWorkspace.vue` and `ReferenceBank.vue`. They should match `src/practice/fundamentals.ts`.

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
- The draw timer is the 15-minute session above, with no separate wrap-up minute
- Save versus delete after a session is Save artwork versus Discard, as above

Do not invent these while building the four specified concepts.

## Spec spots that block a faithful translation

Ask before adding a Redraw concept to `design/` or changing a deliverable. A quiet repair would be a design change.

- **ReferencePhotoBinning — resolved on 2026-11-23.** See the reference bank note. The curator is an argument, and the shared bank is the one set of tagged photos rather than a stored day.
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
