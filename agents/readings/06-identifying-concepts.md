# How to identify concepts

Original: https://61040.github.io/fa26/background/identifying-concepts/

## Lifetime of one concept

1. Outline: name, purpose, principle
2. Generalize: drop accidental details of the story that motivated it
3. Elaborate: state and actions (readings 7–9)
4. Implement

Concepts stay ignorant of each other at every step. Composition comes later.

## Minimal outline

- **Name.** An activity over time, not an entity and not a single verb in the moment. `Authenticate` is an action. `Authenticating` is a concept.
- **Purpose.** Why it exists, including the bad situation it mitigates.
- **Principle.** The archetypal happy path that shows the purpose. Include a “negative” step (delete, expire, revoke) only when that step *is* the purpose, as in Trashing or token revoke. Omit ordinary error paths.

## Where a concept comes from

- **Adopt** a familiar course of action (a cart, reserving, sessioning).
- **Adapt** an existing activity.
- **Innovate** only when people lacked that course of action.

Compare concepts by purpose *and* principle. Offer/accept protocols can be Inviting or Proposing; merging them loses one of them. Password, passkey, recovery codes, and access tokens look like “auth” and do not share one purpose.

## Generalize, then maybe split

A concept tied to one product’s nouns is often a familiar concept over a parameter (`Resource`, `Subject`, `Use`). An awkward leftover word often means two concepts.

## When drafting

Do not skip the outline. Do not encode the first domain story into the concept’s types if a parameter would keep it reusable.
