# How to set up a repo for the class

Original: https://61040.github.io/fa26/guides/repo/

The course page describes the **private** repo each student uses for exercises and reflections. The **team** repo is this one: shared design and, later, the app.

## Private repo (not this folder)

Staff expect work to be easy to find. The suggested shape is:

```
/
|- README.md
|- exercises/
|- reflections/
```

Reflections can be one journal or one file per assignment. They are submitted from that private repo at the end of the semester. Do not put them here.

## This repo

- The root `README.md` links team bios, mentor notes, and deliverables.
- Submitted design lives in `deliverables/`. Meeting notes live in `mentor-meetings/`. Leave both alone unless a teammate asks for an edit.
- Implementation, when the team starts it, follows `../generating-code.md`: `design/`, `src/`, and a Vue frontend in `web/`.
- Do not add an `exercises/` tree here to match the private-repo guide.

## When asked to “set up the repo”

Do not restructure `deliverables/`. Do not create the app scaffold unless the request is specifically to start implementation.
