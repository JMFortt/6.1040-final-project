# Concept design and agentic AI

Original: https://61040.github.io/fa26/background/concept-design-and-agentic-ai/

The same rules apply to a coding agent and to any agentic feature inside the product.

## Give the agent actions, not a tool pile

Do not hand an agent arbitrary APIs. Give it **concept actions**. Behavior stays inside courses of action the spec already allows.

Deterministic follow-ups belong in reactions (a machine always notifies after an invite). Inference belongs in a concept action that is allowed to be uncertain. Human judgment belongs in concepts such as Approving, Delegating, or Authorizing, not in an ad hoc `if` inside another concept.

## What this prevents

- Filling gaps with invented behavior
- Details accumulating in code that nobody specified
- Losing the path from problem, to concept purpose, to action, to implementation

## When generating code

If the spec is silent, do not guess a product decision. Write the missing purpose, principle, or action into the executable spec, with the team’s agreement, and then implement. Filling the gap in TypeScript is how an agent drifts.
