# Rubric: concept design

Original: https://61040.github.io/fa26/rubrics/concept-design/

Score a product design and an implemented spec separately when both exist. A concept that is specified and not yet coded is not an implementation failure. A running module with no spec is.

## Qualities

- **Purpose** — each concept has a clear purpose and a principle that shows how the behavior fulfills it
- **Independence** — no foreign state or actions inside state or actions; external types are parameters. The purpose and principle may mention surrounding activity
- **Precision** — state and actions complete enough, including conditions and effects
- **Composition** — essential reactions use the class form and link concepts without coupling them

## Pitfalls

Data structures presented as concepts. Hidden dependencies. A reaction that is an imperative script. Missing behavior the reader must invent. Extra concepts or actions that do not help the problem.

## Levels

- **Deficient** — concepts that cannot be understood; missing specs or missing composition
- **Emergent** — some clear purposes; conflation, incomplete specs, or gaps in the reactions
- **Competent** — purposeful, independent, and precise; reactions support the app; scope is controlled
- **Expert** — a split or a join that makes a hard part simpler
