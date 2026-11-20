# A notation for state (Simple State Form)

Original: https://61040.github.io/fa26/background/specifying-concept-state/

SSF is the language of `state` blocks. It is whitespace-sensitive. One declaration per line. Fields and `unique` constraints indent under the set they belong to.

## What you may declare

- **Sets or sequences of individuals** (`a set of Users with …`, `a seq of Entries with …`)
- **Subsets** (`a banned set of Users`, optionally `where status is PENDING`)
- **Aliases** (`alias Member for Users`)
- **Rules** (`Rule: …`), prose invariants the actions must preserve

## Fields

- Types are capitalized: individuals, parameters, enumerations, primitives (`Number`, `String`, `Flag`, `Date`, `DateTime`)
- Field names are lowercase. Omit the name to default to the type (`a User` → field `user`; `a set of Options` → `options`)
- Modifiers: `optional`, `unique` on scalars. Collections are not `optional`; use empty.
- `unique item and voter` is compound uniqueness
- `seq` when order matters. Subsets still use `set`
- `an element GlobalSettings` is a singleton

Enumerations are declared under types (`UserStatus is PENDING or REGISTERED`) and written in uppercase.

## Meanings that matter in code

- An individual is an identity. Grouping fields under `Users` is notation, not an object model.
- Adding to a **set** records an individual this concept tracks. Adding to a **subset** classifies an individual that already exists.
- A **parameter type** is external: stored as an id, not owned. Do not declare “the set of all users in the world” unless this concept allocates them.
- A MongoDB unique index is the usual realization of `unique`.
- Do not declare the reverse of a field you already have.

## When the block will not parse

If the state cannot be read as sets and relations, fix the spec before writing a schema. Extra fields stored “because the UI needs them” belong in another concept, or they are a hole in the spec.
