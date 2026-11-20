# Defining concepts

Original: https://61040.github.io/fa26/background/defining-concepts/

The outline is not enough to generate code. The definition must make **all** scenarios predictable, assign **responsibility**, and say what is **remembered**.

## Actions from the principle

For each step in the principle: is it this concept’s action, or context from another concept? Hints it belongs elsewhere: it has its own lifecycle; it would be a different action in another app; the principle still works without it.

Then add compensating actions (cancel, withdraw) and significant non-happenings (noshow) when they matter to *this* purpose. Do not pull in another concept’s undo.

## Individuals and values

- **Individual.** Persistent identity (person, reservation, session). Passed as an id. Its properties exist only as relations in this concept’s state. Do not open the id and read fields.
- **Value.** Number, string, flag, date: structure without identity. Two equal values are the same value.

A person does not “contain” a name. Naming is another concept. If an action needs a username, either this concept stores usernames or a reaction queries the naming concept and passes the user id onward.

## Arguments

Ask what makes two occurrences distinct. Created individuals are outputs (`register` returns `user`, `start` returns `session`). Environment individuals are inputs (`subject`, `person`). The performer is an argument only if this concept’s behavior depends on who they are.

A screen that collects several fields does not force those fields to be action inputs. Another concept can allocate an identity, and the reaction can pass that identity in.

## State

State is what must be remembered so the next action can be allowed and its outputs computed. Too little state makes a rule unenforceable (one vote per user needs voter and item, not only a count). Extra state is a tradeoff (keep cancelled reservations, or delete them).

Think in **facts**, not objects. Connect state to actions with `where` (precondition on state and inputs) then `then` (add or remove facts, produce outputs).

Start from actions or from state, whichever the purpose suggests. Iterate when a case such as double-voting forces another fact.

## When generating a class

Every method argument and every stored field must be justifiable from this definition. Needing another concept’s attribute inside this class means the boundary is wrong.
