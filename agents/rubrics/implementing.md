# Implementing a concept-based application

No separate page on the [rubrics list](https://61040.github.io/fa26/resources/#rubrics). Criteria come from [P2](https://61040.github.io/fa26/assignments/p2/) and [P3](https://61040.github.io/fa26/assignments/p3/), plus `../modularity.md`.

## What staff look for

- The core user journey works across concepts, reactions, frontend, and MongoDB, including access control where the design has it
- The UI updates without a full reload; validation and errors for that journey are informative
- Each implemented concept has an executable spec; code matches (`bun run check`)
- Concept classes do not call each other; reactions and endpoints compose them
- Work proceeds in small steps that can be checked, especially when an agent is writing the code

## Levels

- **Deficient** — the journey does not run, or the concepts are one shared object model
- **Emergent** — some actions work; coupling, missing specs, or frontend/backend drift
- **Competent** — the claimed journey is real end to end; specs and code agree; modularity holds
- **Expert** — composition is small and obvious; a change stays local; starter-template residue is gone or clearly isolated

Score the journey that exists. Do not mark a concept as unimplemented-and-therefore-failing when the team has not claimed it is built yet. Do not mark a running subset as if it were the whole product.
