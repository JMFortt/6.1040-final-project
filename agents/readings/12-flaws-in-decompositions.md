# Flaws in concept decompositions

Original: https://61040.github.io/fa26/background/flaws-in-concept-decompositions/

Review the set of concepts, not each spec alone.

## Cohesion

- The purpose is compelling: value plus a bad situation, not “manages users.”
- The course of action makes sense **alone**. Actions should not only make sense when another concept is running.
- State is dense: most actions touch most of this concept’s facts. A row of unrelated fields with a setter each means split.
- Optional arguments and disjunctive specs often mean two actions, or two concepts. An optional that refines the same behavior (a default channel on send) can stay.

## Separation of concerns

- **One purpose.** Liking a song in a way that both favorites it and trains a recommender is two concepts.
- No compelling subconcept left inside (sessioning inside authenticating; membership inside group chat; allocating inside reserving).
- No details another concept already owns (a department copied into an expense report, unless this report can choose a department).
- One role per state component. An email is not both the username and the notification channel. The time a cart opened is not the order timestamp.

## Completeness

- Full lifecycle: create what you later require. Authentication without register is fragmented. Reserve without redeem is incomplete. Join-group without create-group is a split. A cart needs its own end action even if ordering exists.
- Not mere CRUD. If the real protocol has partial fills, holds, flags, or stages, the actions should say so. A global “Preferences” bag is not a concept.

## Complicated reactions mean a bad split

Watch for extra `where` guards that exist only because some fact lives next door, for names and addresses kept in sync by copying, and for fat argument lists. Copying an address into an order can be *good* redundancy when the two records have different lifecycles (an editable address book versus a frozen order).

## Before changing the set

Before adding a concept: could this be a reaction on concepts you already have?

Before merging two: would you lose an independent purpose, or a concept you could reuse?

Before implementing a hairy endpoint: is a concept fragmented?
