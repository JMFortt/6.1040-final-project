# Modularity

Concept design’s split is stricter than ordinary layering. Concepts stay independent after they are composed. Composition coordinates them. It does not couple them.

Course pages: [How to decompose](https://61040.github.io/fa26/background/decomposing-into-concepts/), [Flaws in definitions](https://61040.github.io/fa26/background/flaws-in-concept-definitions/), [Flaws in decompositions](https://61040.github.io/fa26/background/flaws-in-concept-decompositions/). Checklists: `readings/11-flaws-in-definitions.md`, `readings/12-flaws-in-decompositions.md`.

This file is the rule. It is not a description of Redraw. App-specific questions are in `working-notes.md`.

## Independence

| Rule | Meaning |
| --- | --- |
| No calls | A concept class does not invoke another concept. Follow-up behavior is a composition: `when` / `where` / `then`, or an endpoint chain. |
| No shared state | A concept reads and writes only its own records. A query exposes that concept’s facts. It does not join another concept’s collections. |
| Identities only | Individuals cross the boundary as opaque ids. Do not pass an object full of fields. Do not mutate an argument. |
| No assumptions about foreign types | External types are parameters. Sessioning knows a `Subject`. It does not know that the subject has a username. Bindings are declared outside the concept. |
| No system talk | State and actions do not name the app, HTTP, cookies, or other concepts. Notes and compositions may. |

## View separation

The same individual can carry different facts in different concepts. One concept may associate a person with a username. Another may associate a session with that person. A third may associate the person with a streak count. None of those facts live on a shared `User` object.

## What compositions are for

Reactions are the only place data and control flow between concepts.

Typical jobs:

- Access: establish who is acting (for example `Sessioning.use`), then pass that identity into later actions. Do not trust a user id from the request body.
- Follow-up: after one concept finishes, fire another concept’s action.
- Invariants that span concepts: cascade a delete, copy an identity, refuse when another concept’s query says no.

A reaction may decline to fire an action. It cannot reach into a concept and cancel an action that already happened. To keep an action private, leave it off the public boundary and fire it only from a reaction.

## When a reaction looks too heavy

A long `where`, copied fields, or a large tuple passed between concepts often means a bad split (one lifecycle in pieces) or a bad merge (two purposes in one concept). Change the concepts. Do not hide the problem in the composition. See `readings/12-flaws-in-decompositions.md`.

## The usual trap

Do not put “everything about a user” in one module. Authenticating, sessioning, and displaying a profile are different activities. A class named `User` that owns password, session, and practice stats is not a concept.
