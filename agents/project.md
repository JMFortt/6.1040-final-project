# Redraw

App: **Redraw**. Team: Aden, Eric, Julia, Amina. Course: 6.1040.

This file is a map of design goals. The deliverables are the design. If this file and a deliverable disagree, the deliverable wins until the team changes it.

Current design: [`deliverables/F3/main.md`](../deliverables/F3/main.md).

Earlier framing, kept as submitted: [`deliverables/F2.md`](../deliverables/F2.md). F2 called the shared bank `ClassReferenceBank` and the canvas concept `Drawing`. F3 renamed those roles to `ReferencePhotoBinning` and `TimeLapsing`.

## Who it is for

Artists who already draw — hobbyists, students, aspiring illustrators — and want structured practice. Redraw is not a learn-to-draw course. It does not teach steps or grade how accurate a drawing is.

Source: [`deliverables/F3/problem-framing.md`](../deliverables/F3/problem-framing.md).

## What it is trying to change

Self-taught practice drifts into favorite subjects, so weak fundamentals stay weak and nobody notices. Finding a photo that is actually good for one fundamental uses up the time that was meant for drawing. Drill-style courses feel monotonous to intermediate artists. A short break kills the routine. Practicing alone gives no view of how someone else handled the same problem, and social media only shows polished work made from different references. Attempts scatter across apps, so improvement is hard to see.

## Design goals

From [`deliverables/F3/design-summary.md`](../deliverables/F3/design-summary.md):

Help artists practice consistently by giving them structure and a reason to show up with other people.

- **ReferencePhotoBinning** is the core. References are split by fundamental (perspective, color, and so on). People active in the same period draw from the same small bank, which cuts search time and gives them a shared problem.
- **CoverageTracking** makes neglected and familiar fundamentals visible.
- **StreakTracking** is light pressure to come back.
- **TimeLapsing** records the drawing so someone can watch the process, not only the finished piece. That is also the response to comparison anxiety in the ethical analysis: a replay frames the work as a process.

The in-app canvas exists so people share tools as well as references, and so a time-lapse can be produced. The development plan treats the editor as technically risky. Fallback if a from-scratch canvas fails: accept an upload made elsewhere, or use an existing browser drawing API. Time-lapse can move to a later checkpoint or be dropped; the plan says it is not the core of the design. Source: [`deliverables/F3/development-plan.md`](../deliverables/F3/development-plan.md).

## Concepts with specifications

These four have specs under `deliverables/F3/concepts/`. Purposes below are compressed from those files.

| Concept | Purpose in Redraw | Spec |
| --- | --- | --- |
| ReferencePhotoBinning | Same bank for everyone in a time window; images tagged by the fundamentals they exercise | [spec](../deliverables/F3/concepts/ReferencePhotoBinning.md) |
| CoverageTracking | Count how much each fundamental has been practiced | [spec](../deliverables/F3/concepts/CoverageTracking.md) |
| TimeLapsing | Record ordered canvas updates and replay them | [spec](../deliverables/F3/concepts/TimeLapsing.md) |
| StreakTracking | Increase a streak on a new active day; reset after a missed day | [spec](../deliverables/F3/concepts/StreakTracking.md) |

The only reaction written in F3:

```
reaction finishDrawing
  when Requesting.SubmitDrawing(user, drawing, referenceImage)
  then
    CoverageTracking.addImage(image: referenceImage)
    StreakTracking.engage(user)
```

Source: [`deliverables/F3/concept-design.md`](../deliverables/F3/concept-design.md).

## Named, not yet specified

The F3 solution sketch and the [user journey](../deliverables/F3/user-journey.md) also depend on behavior that has no concept spec yet:

- **Authenticating** — register and return
- **Posting** — share a drawing of a reference with other people who drew that reference
- Journey details with no spec: following, username search, a feed filter, a 30-minute timer plus a one-minute wrap-up, and save versus delete

Do not invent those specs while implementing the four above. Questions are in [`working-notes.md`](working-notes.md).

## Constraints that bind implementation

From the ethical analysis in the F3 problem framing. These are design decisions, not optional polish.

- Tag reference photos by hand for the first running version. AI labeling is an open question after that checkpoint, not a default. See also the design summary.
- Use public-domain images (the notes name CC0 / Wikimedia Commons) and credit authors. Do not scrape the web for the bank.
- Plan a report path for posted drawings. The team expects to turn posting off when nobody is left to moderate.
- Let a person download their own submissions. Do not offer a download of every image on the site.
- Keep time-lapse available on shared work so comparison shows process. If time-lapse is deferred, say so; do not replace it with a score of accuracy.

## Other design artifacts

| Artifact | File |
| --- | --- |
| User journey | [`deliverables/F3/user-journey.md`](../deliverables/F3/user-journey.md) |
| Visual design study | [`deliverables/F3/visual-design-study.md`](../deliverables/F3/visual-design-study.md) (slides plus images) |
| Development plan | [`deliverables/F3/development-plan.md`](../deliverables/F3/development-plan.md) |
| Mentor meetings | [`mentor-meetings/`](../mentor-meetings/mentor-meetings.md) |

Primary oversight of each concept changes by checkpoint. Read the development plan. The course still expects every teammate to take part in framing, design, and implementation. See [`assignment.md`](assignment.md).

## What is not built yet

There is no `design/`, `src/`, or Vue app under `web/` yet. Absence of code is expected. Do not treat it as a broken app, and do not start the scaffold until the team asks. When that app exists, the screens are Vue single-file components. See `howtos/04-sync-engine-local.md`.
