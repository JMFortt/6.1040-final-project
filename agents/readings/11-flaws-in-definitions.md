# Flaws in concept definitions

Original: https://61040.github.io/fa26/background/flaws-in-concept-definitions/

Use this checklist before implementing. Review one concept. Review the set of concepts with reading 12.

## Boundaries

- **Conflation.** Two purposes in one concept (authentication and profile; authentication and karma). “All the fields of User” is the usual cause. Authentication and sessioning can be one concept; they are clearer split.
- **Fragmentation.** One lifecycle split across concepts (add-to-cart versus checkout; register versus login). Phases of the same state belong together.

## Modularity violations

Do not implement these “temporarily.”

- Reading another concept’s property of an individual (`author.username` inside posting)
- Calling another concept from an action body (register “also notifies”)
- Naming the host system or another concept in state or actions (notes, and lightly the principle, may)

## Structure

- **Mixed parts.** A purpose that tells a scenario. A principle that explains why, or that restates the schema.
- **A class, not a concept.** The name is an entity, the principle is CRUD, the purpose is “manage X.”

## Name

Use a gerund of an activity. Avoid using the same word for the concept and for the individual it mints (`Reservation` the concept versus `Reservation` the individual).

## Purpose

Not vague, not interchangeable with a neighbor, not overloaded. Trash is undoable deletion, not “an easier delete button.”

## Principle

Include setup. Include enough individuals to show the purpose. Omit unhappy paths unless they are the purpose.

## State

- A **set** of individuals, not a singleton pile of fields, unless the concept truly has one element
- Individuals are identities, not structs. Do not invent extra id fields unless issuing identity is the concept
- Rich enough for every precondition (a double-vote needs voter and item, not only a count)
- Enough keys (a salary that depends on the job needs employee and company)
- Not vague (“a version history” with no structure)
- No redundant reverse relations

## Actions

- Missing setup, undo, or terminate
- Extra actions that a reaction plus an existing query could handle
- A flag, a disjunction, or an optional argument that changes the meaning (split into two actions)
- Implicit preconditions, or “if already reserved, do nothing” as a successful outcome
- A query written as an action, unless the occurrence itself matters (`authenticate`)

## Notes

Use them. Title each note.

## Before coding

If a draft hits a modularity bullet, rewrite the spec with the team. Do not code the violation.
