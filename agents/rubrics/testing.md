# Testing and validating software

No separate page on the [rubrics list](https://61040.github.io/fa26/resources/#rubrics). Criteria come from [P3](https://61040.github.io/fa26/assignments/p3/) and the MongoDB how-to (step 5). User-testing logistics for this project are in `../assignment.md` (F6).

## Concept tests (`bun test`)

For each completed concept:

- A sequence that matches the operational principle
- Further scenarios: delete, cancel, repeat
- Error cases: the expected refusal, and **no** change along the success path
- Every action runs in at least one test
- Assertions in code, not a reading of the logs
- A fresh database; rows created by **actions**, not by inserts

## Journey checks

The interface updates. Data persists. Bad input is refused. Another user cannot read or change what they should not. Record what was checked.

## Levels

- **Deficient** — no automated tests, or tests that still pass when the spec is broken
- **Emergent** — some principle tests; missing refusals or the other-user cases
- **Competent** — each implemented concept covered as above; the journey checked
- **Expert** — races (unique index) and composition traces are checked too

The course default database for tests is the local container. `mongodb-memory-server` is a new package; ask before adding it. Until a concept is implemented, do not treat a missing `tests/` directory as a failed rubric.
