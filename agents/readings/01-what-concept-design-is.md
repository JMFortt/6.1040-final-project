# What concept design is

Original: https://61040.github.io/fa26/background/what-concept-design-is/

Concept design is a way to design **courses of action**: behavior that fulfills a stated purpose. People, machines, or agents can carry the behavior out. The method is not a UI method and not a programming stack.

## Properties to preserve

1. **Shared language.** The spec is what the team, an agent, and the sync engine share. Code comments and UI copy use the same concept and action names.
2. **Untangling.** Each concept is an independent behavior. Complexity sits in the composition of simple concepts, not inside one mixed module.
3. **Familiar patterns.** Prefer a known concept over a custom invention. Specialize in reactions, not by forking the concept.

## When adding a feature

Name the activity and its purpose first. If it is not a course of action with a purpose, it is not a concept, and it should not become a new class.
