# Application types

The app combines ConceptBox’s account boilerplate with TimeLapsing. The team requested the drawing editor on 2026-11-20 and chose one persistent private canvas per artist. On 2026-11-22 they added numbered completed histories, with submission starting a blank working canvas and preserving the prior history for replay.

Authenticating, Federating, and Sessioning do not mint a person. Each one takes a user that Registering created. CommonsFederating is Federating with Commons as the other site.

```instances
instantiate Registering

instantiate Authenticating with
  User is Registering.User

instantiate Federating as CommonsFederating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User

instantiate TimeLapsing with
  Owner is Registering.User
```
