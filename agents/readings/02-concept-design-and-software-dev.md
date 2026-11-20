# Concept design and software development

Original: https://61040.github.io/fa26/background/concept-design-and-software-dev/

## What changes in the code

- The hard problem is **what the software should do**. Specs state that without screens or a storage engine.
- Separation in the design **is** modularity in the code: one concept, one module, no mutual imports.
- Reuse happens at the concept, then at the class. The same Sessioning can appear in another app.
- Novel behavior should be a small named residue after familiar concepts are factored out.
- Design is the source of truth. Code is a translation. That inverts “the code is the spec.”

## Habits that undo the method

| Slide back toward | Stay with |
| --- | --- |
| Wireframes or class diagrams as the design | Actions on individuals that change facts |
| One module calling another | Reaction rules outside both modules |
| Domain objects that own every attribute | Each concept holds its own facts about an identity |
| A purpose only for the whole product | A purpose for every concept |

## What this is not

- Not object-oriented design. Do not hang authenticating, friending, and subscribing on `User`.
- Not a bounded context that privately remodels the same activity. Share the concept.
- Not a publish-subscribe bus inside concept classes. Coordination is declared outside them.
- Not “no design, iterate in code.”
- Not a workshop process with no artifacts. Reuse known concepts. Invent when they fail.

## When generating code

If a pattern (factory, DI container, shared User model, event bus) would hide a cross-concept dependency, refuse it. Sync-engine compositions are already the reaction rules.
