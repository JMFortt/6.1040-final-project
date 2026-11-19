# How to decompose into concepts

Original: https://61040.github.io/fa26/background/decomposing-into-concepts/

Prefer several small concepts over one large course of action. The gains are simpler parts, familiar reuse, localized change, and more reliable implementation (including code an agent writes). A bad split is worse than one large concept.

Independence rules in code: `../modularity.md`.

## How composition works

A system trace is an **interleaving** of concept traces. Filtering to one concept’s actions must still be a legal trace of that concept. State exists so traces can be defined, so reactions can query facts, and so people can sometimes see those facts.

**Reactions** constrain interleavings:

```
when an action occurs
where some facts hold (possibly in several concepts)
then other action(s) occur
```

They maintain invariants, gate access, and automate follow-ups. They cannot suppress an action that is already firing. Hide that action from the outside and fire it only from a reaction.

Example: Posting and Commenting interleave freely. A reaction decides whether deleting a post is refused, cascades to comments, or becomes an edit that marks the post deleted.

## Independence

- No calls between concepts
- No shared state (a query reads only its own facts)
- No mutable objects passed — identities and values only
- No constraints on another concept’s types (`Author` is a parameter, not “must have a name”)

## How to split

1. Recognize familiar concepts. Keep them conventional. Put app-specific policy in reactions.
2. Judge leftovers with reading 12 (cohesion, separation, completeness).
3. Read the reactions. If they are messy, the split is probably wrong: missing state, a fragmented lifecycle, or fields copied across concepts.

## When implementing

Do not import one concept inside another to display a name. Query in a composition and pass identities. Do not put cascade-delete inside the parent concept. Keep the child’s lifecycle complete, and let the reaction call remove.
