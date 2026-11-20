# What a concept is and is not

Original: https://61040.github.io/fa26/background/what-a-concept-is/

## A concept is

A **behavior** (the set of possible action sequences) **with a purpose**.

In practice it is also a service (actions plus queries), a social protocol, a policy, an invention, something that can be reused, a piece of expert vocabulary, and the user’s mental model.

Example: Authenticating’s purpose is to identify users and stop masquerading. Its behavior includes register, authenticate, and change-password sequences, for many users, interleaved.

## A concept is not

| Not this | Why it fails |
| --- | --- |
| A classification (“dog”) | No course of action |
| A philosophical idea (“solipsism”) | No actions and state |
| An entity (“Reservation”, “User”, “File”) | Entities are *state* of a concept, not the concept |

If a module is named after a noun in the data model and its principle is CRUD, it is an entity wearing a concept name. Rename it as an activity (`Registering`, `Reserving`, `Trashing`) or split it until each piece has a purpose.

## When reviewing a spec or a class

Reject a name that is an object type. `User.ts` is a smell. `Registering.ts` can be a concept.
