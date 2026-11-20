# ConceptBox

Original: https://github.com/mit-sdg/conceptbox

ConceptBox is the class reference app: files, sharing, trash, password and Commons sign-in, and an optional describing agent. Its UI is Vue, which matches this class. **Copy parts** when the team asks. Do not vendor the whole app. Do not take object storage or a model API unless that choice is recorded in `../working-notes.md`.

## How its README says to copy

1. Copy the files to the same paths.
2. Register them: concepts in `src/concepts.ts` and `design/types.md`; compositions in assembly and `generated.config.ts`.
3. `bun run generate` and `bun run check`.

Reusable account compositions expect concept names such as `Sessioning` and import a shared inputs module. Copying them only makes sense after this repo has the same layout, and after the team has decided that Redraw uses those concepts.

## Patterns worth copying

Identities only. A session check at the start of an authenticated endpoint, once authentication exists. Unique Mongo indexes. `refuses` mapped in HTTP policy. One concept, one module.

## What not to copy just because it is there

| ConceptBox | This project |
| --- | --- |
| Vue single-file components calling the typed client | Same idea. Copy that shape, not ConceptBox’s screens |
| Object storage for file bytes | Not in the stack |
| Password auth and Commons auth | Both exist upstream. Redraw has not specified Authenticating yet |
| Storing, Sharing, Trashing, Labeling, an LLM concept | Different purposes from Redraw’s concepts. Do not rename them and hope |

## Rule

Match ConceptBox’s file layout and independence. Do not import it as a dependency. Do not copy a concept whose purpose is not the one in `../project.md`.
