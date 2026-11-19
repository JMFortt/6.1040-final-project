# How to write concept specifications

Original: https://61040.github.io/fa26/background/specifying-concepts/

Executable specs use the headings below. Keep notes for history, variants, and alternatives. The notation for state is reading 9. How those sections become TypeScript is `../generating-code.md`.

## Parts

1. **Name** — an activity over time (`UserAuthenticating`, not `Authenticate`, not `User`)
2. **Types** — `external` parameters and enumerations
3. **Purpose** — need-focused, specific to this concept, something a reader can judge; exactly one purpose
4. **Principle** — the defining story; goal-focused and archetypal; informal prose is fine
5. **State** — SSF; only facts this behavior needs
6. **Actions** — signatures plus `where` / `then`; named inputs and outputs
7. **Queries** — names that start with `_`; `one` / `optional` / `many`; no mutation
8. **Notes** — system role, variants, debates. This is the place to discuss other concepts at length.

## Purpose tests

A purpose fails if it restates a screen (“let users click upvote”), states a universal goal (“increase engagement”), or sits too far from the mechanism (“improve content quality”). A usable purpose names the mechanism and what it prevents.

Do not name the host app in the purpose. Overloading (one concept used as both access control and a feed filter) means split.

## Principle tests

The last beat should fulfill the purpose. Include the extra action that justifies the concept (revoke, redeem). Do not include error cases. Use several individuals when the idea is aggregation (upvoting).

The principle may allude to another concept (“then a message is sent”). State and actions must not depend on that concept.

## Actions

```
register (username: String, password: String) : returns (user: User)
  where … then … returns / refuses CODE "message"
```

`refuses CODE "message"` is for specs that will generate code. A design-only sketch may use preconditions alone. Do not hide a failed case as a no-op success.

Unmentioned state is unchanged. “Set the password of user” is shorthand for replacing a relation. There is still no user object.

## Queries

Always allowed, never update state. The occurrence is usually insignificant. `authenticate` can still be an action with no state change when the event itself matters.

## When writing one

Use the headings `Purpose`, `Principle`, `Types`, `State`, `Actions`, `Queries`. After the team has asked for code, update the matching class in the same change as the executable spec.
