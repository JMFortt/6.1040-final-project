# Open questions

Unresolved on purpose. Add a dated note when the team decides. Do not edit `deliverables/` to close one of these unless a teammate asks.

## 2026-11-19 — account boilerplate

`bun run dev` runs ConceptBox’s Registering, Authenticating, Federating (Commons), and Sessioning, with the passwords and Commons sign-in compositions. Registering is included because the other three are parameterized on `Registering.User`. Redraw concepts from `deliverables/` are not instantiated.

Vue 3 and Vite are the frontend. Further dependencies still wait for a team decision (`AGENTS.md`).

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
- **TimeLapsing** stores one sequence of updates. `_render` takes no drawing, user, or session. The journey needs a replay of one person’s drawing.
- **StreakTracking.** The principle is “first engagement in 24 hours increments; a missed day resets.” `engage` also says the new day must be one higher than the previous. `expire` is a separate action. Day boundaries (midnight versus rolling 24 hours) are not defined. The state field is a `Number`.

## Stack and policy not chosen yet

- Vue 3 and Vite are the frontend. Further dependencies still wait for a team decision (`AGENTS.md`).
- AI for collecting or tagging images is deferred past the first checkpoint. Hand-tagged public-domain images until that decision.
- The boilerplate offers both a password and Commons sign-in, copied from ConceptBox. Which of those Redraw keeps is still open.
- Canvas approach is intentionally thin in the concept specs. Fallbacks are in the development plan (upload, or a browser drawing API). Pick one when implementation of drawing starts.

## Primary oversight

Owners in the development plan change at each checkpoint (design draft, MVP, usability, then a shared ticket list). Read that table before assuming who is watching a concept. Everyone still takes part in framing, design, and implementation.
