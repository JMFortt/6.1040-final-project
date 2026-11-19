# Final project process

Assignment: [Final project](https://61040.github.io/fa26/assignments/final-project/).

This file is how the course runs the team project. It is not a concept-design guide. Principles stay in `readings/` and `rubrics/`. Redraw’s goals stay in `project.md`.

Activities that already appeared in the personal project (framing, concept design, implementation, testing) are specified in the earlier assignment pages and in `rubrics/`. This page adds team process, ethical analysis, and the checkpoint list.

## How the team is expected to work

Everyone contributes about equally and joins every kind of activity. Splitting by area is fine (one person watching a concept). Splitting so that someone never frames, designs, or implements is not. The usual outcome is one shared grade.

Advice from the assignment that should change planning:

- Bring mentors a prepared problem, a question, and a plan. They are consultants.
- Be ambitious and keep the concept count small. One strong concept beats many thin ones.
- If a dependency might fail, keep the fallback that is already in the development plan.
- When a task overruns, change the plan instead of hoping the deadline moves.
- No late submissions.

## Checkpoints

Deadlines are 11:59pm that day. Dates below are the ones published on the assignment page.

| Deliverable | Deadline | Notes |
| --- | --- | --- |
| Team formation | Tue Oct 27 | One form per student |
| F0: Team contract | Sun Nov 1 | Before team work |
| Initial mentor meeting | Fri Nov 6 | By arrangement |
| F1: Project pitch | Mon Nov 9 | In class |
| C1: pitch critique | Tue Nov 10 | |
| F2: Problem framing | Thu Nov 12 | Includes ethical analysis |
| C2: problem framing critique | Sat Nov 14 | |
| F3: Concept design | Mon Nov 16 | Includes development plan |
| C3: concept design critique | Thu Nov 19 | |
| F4: Alpha | Mon Nov 23 | First running version |
| F5: Beta | Mon Nov 30 | Near-complete running version |
| F6: User testing | Mon Dec 7 | Schedule users ahead of this |
| F7: Demo and report | Wed Dec 9 | |

User testing needs people who fit the domain. Book them before the week of F6.

## Ethical analysis

Part of problem framing for this project only. Using value sensitive design, name undesirable consequences of apps in this problem area, then take lessons that change Redraw’s own design. The F3 write-up is the current version. Do not treat those lessons as a separate optional essay; `project.md` lists the ones that constrain the app.

## Mentor meetings

Weekly, after the first meeting. Every member attends. Misses are told to the mentor in advance.

The team runs the meeting. Come in with a progress report, issues, and an agenda (topic and minutes). Leave with next week’s plan and the decisions made.

Each meeting’s notes, kept in `mentor-meetings/`, need:

- Agenda
- Progress since last time, against the plan
- Design changes since last time
- Issues, each in a sentence or two
- Plans and decisions, written after the meeting

There is no Commons drop for these notes. They still count. Rubrics: professionalism, project management. Do not edit `mentor-meetings/` unless a teammate asks.

## Repo and submission

One shared GitHub repo. Feature branches, regular commits, pull requests into the main branch. Reflections stay in each person’s private repo and are not written here.

Non-code artifacts are Markdown, with diagrams and screenshots as linked images.

Staff grade a commit URL, not whatever `main` says later. Steps: [`howtos/02-commit-hash.md`](howtos/02-commit-hash.md). No slack days.

## Which rubric applies where

Criteria for each rubric are in `rubrics/`. This table only says which artifact to read.

| Artifact | Rubrics |
| --- | --- |
| `deliverables/F2.md`, `deliverables/F3/problem-framing.md` | Problem framing, technical writing. Ethical analysis is part of this project’s framing. |
| `deliverables/F3/concept-design.md` and `deliverables/F3/concepts/` | Concept design, technical writing |
| `deliverables/F3/user-journey.md`, pitch materials if present | Communicating a proposed solution, technical writing |
| `deliverables/F3/visual-design-study.md` | Visual design |
| `deliverables/F3/development-plan.md`, `mentor-meetings/` | Project management, professionalism |
| Future `design/` + `src/` | Concept design (implemented subset), implementing |
| Future UI | Interaction design, visual design |
| Future tests, and F6 | Testing |
| Personal reflections | Reflective practice — private repos, not this one |
| The repo as something another person can clone and navigate | Professionalism |

When reviewing, give a level and a few concrete observations. Do not “fix” a deliverable as part of the review unless the team asks. Propose changes; leave the file alone.

## Implementation checkpoints, in course terms

F4 is the first running version. F5 is nearly complete. The team’s own plan (design draft, MVP, usability, finished product) is in the development plan, not a replacement for these dates. Sync engine is required. Extra technologies are allowed only as a recorded team choice (`AGENTS.md`).
