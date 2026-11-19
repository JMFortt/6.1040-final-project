# Generating code from concept specs

This file is the class translation from a course-format spec to Bun and the sync engine. It does not decide what Redraw does. Goals and the current specs are in `project.md`. Open gaps are in `working-notes.md`.

Two documents, two jobs, once implementation starts:

- **`deliverables/`** is the design the team submitted. Read it. Do not edit it unless asked.
- **`design/`** will be the executable spec for whatever is implemented. TypeScript under `src/` must match `design/`, not a paraphrase of the deliverable made up in the class.

If `src/` and `design/` disagree, `design/` wins: change `design/` on purpose, then the code. If `design/` and a deliverable disagree, ask. Do not edit the deliverable to hide the difference.

There is no `design/` or `src/` in this repo yet. Do not create them until the team asks to implement.

Course pages: [Writing specifications](https://61040.github.io/fa26/background/specifying-concepts/), [State notation](https://61040.github.io/fa26/background/specifying-concept-state/), [Defining concepts](https://61040.github.io/fa26/background/defining-concepts/). Commands: `howtos/`.

## File map for one concept `Name`

| Design | Code |
| --- | --- |
| `design/concepts/Name.md` | `src/concepts/Name/Name.ts` (class) |
| same spec, imported as text | `src/concepts/Name/registry.ts` (`registerConcept`) |
| `design/types.md` (`instantiate …`) | generic parameters and the set name in `src/concepts.ts` |
| `design/compositions/…/*.md` | `src/compositions/…/*.ts` (endpoints / reactions) |
| composition listed in `generated.config.ts` | assembled in `src/assembly.ts` |

The registry loads the spec as text:

```ts
import spec from "@design/concepts/Name.md" with { type: "text" };
```

Do not implement a concept that has no executable spec. Do not leave an action in the spec unimplemented.

## Sections of a spec

### Purpose

One sentence of value, plus what bad situation it prevents. It becomes the class docstring. It is not a scenario and not “manages X.”

### Principle

A named-person happy path that shows the purpose. Use it to check completeness. Do not encode the story as a special case in code.

### Types

```types
external Subject
```

External types become TypeScript generics (`SessioningConcept<Subject>`). Enumerations become unions used only by this concept.

Individuals this concept creates become ids the concept mints (branded strings, or MongoDB `_id` values).

### State (SSF)

```state
a set of Sessions with
  a Subject
  a lastUsed DateTime
  an expiresAt DateTime
```

Becomes one collection, or a few collections this concept owns, named `{concept}.{set}` in lowercase, for example `sessioning.sessions`.

| SSF | Mongo / TypeScript |
| --- | --- |
| set of individuals | a collection of documents |
| field of a scalar or an individual | a document field |
| `unique` field | unique index |
| `unique a and b` | compound unique index |
| `optional` | field may be absent |
| `set of` / `seq of` | array field (`seq` keeps order) |
| `Rule:` | action preconditions and/or indexes |
| parameter type | generic, stored as an id |

Do not store the reverse of a relation “for convenience.” A query can look up either direction.

Do not store another concept’s attributes because a screen wants them nearby.

### Actions

Each action is a method. Inputs are one object of named fields. Success returns named outputs. Failure throws an error class that the registry maps to the spec’s refusal code.

```actions
register(username: String) : returns (user: User)
  where username is not well formed
  then
    refuses INVALID_USERNAME "…"
  where some user has username
  then
    refuses USERNAME_TAKEN "…"
  where username is accepted and no user has username
  then
    add a new user with username
    returns user
```

Translation:

- Each refusing `where` / `then` becomes a check and `throw new SomeError("quoted message")`.
- Each succeeding `where` / `then` mutates this concept’s collection and returns the outputs.
- Preconditions are explicit. Do not succeed with no effect when the interesting case did not apply.
- Do not fold two unrelated effects into one method. A flag that changes the meaning is two actions.

Refusal classes stay in the concept file. The registry lists them:

```ts
refusals: {
  INVALID_USERNAME: InvalidUsername,
  USERNAME_TAKEN: UsernameTaken,
},
```

HTTP mapping of those codes belongs in compositions or `src/http.ts`, not in the concept.

Sync-engine 1.1.0 action signatures use `: returns (…)` and each branch ends in `returns` or `refuses`.

### Queries

Names start with `_`. They never mutate. Cardinality matches the return shape:

| Spec | Typical return |
| --- | --- |
| `one (…)` | a single result object |
| `optional (…)` | `[]` or `[{ … }]` |
| `many (…)` | an array of result objects |

Queries exist so reactions can read this concept’s facts. They are not a public REST layer by themselves.

## Instantiation

`design/types.md` binds parameters:

```types
instantiate Sessioning with
  Subject is Registering.User
```

The class stays generic. The registry fixes the type for this app. The concept class still does not import the other concept’s behavior.

Several instances (`instantiate Federating as CommonsFederating`) are different names and bindings for the same concept, not copies of the logic.

## Compositions

A composition describes `when` / `where` / `then` and lists endpoints. TypeScript uses sync-engine combinators: `receive`, `.then(Concept.action(…).responds(…))`, `where`, `no`, `respond`.

Rules:

- A request may carry a session token. It must not carry a user id that the server then trusts. The session concept is the source of the acting person, once the team has specified authentication.
- Branching is the reaction choosing which actions to fire, not an `if` inside a concept.
- Cookies, status codes, and URLs live beside the endpoints, not in concept classes.

## What “generate” means here

1. Read the deliverable outline. Do not edit it.
2. If a gap in `working-notes.md` is still open, ask before writing the executable spec.
3. Write `design/concepts/Name.md` with the course headings (`Purpose`, `Principle`, `Types`, `State`, `Actions`, `Queries`), SSF, and `refuses CODE "message"`.
4. Bind it in `design/types.md` and write compositions.
5. Implement the class as a direct translation of those actions and queries.
6. Register the spec, refusals, and Mongo floor. List the composition in `generated.config.ts`.
7. Call those endpoints from Vue single-file components. The typed client is the only HTTP API the components use.
8. `bun run check:design`, then `bun run check`.

Do not add service layers, repositories wrapped around other repositories, domain objects shared across concepts, or framework machinery (factories, a DI graph, an event bus) that hides a cross-concept call. Vue 3 and Vite are part of the frontend. Do not add React or a second UI kit unless the team asks.
