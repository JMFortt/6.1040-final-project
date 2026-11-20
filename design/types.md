# Account types

The running app is ConceptBox’s account boilerplate. Redraw’s concepts stay in `deliverables/` until the team asks to implement them.

Authenticating, Federating, and Sessioning do not mint a person. Each one takes a user that Registering created. CommonsFederating is Federating with Commons as the other site.

```instances
instantiate Registering

instantiate Authenticating with
  User is Registering.User

instantiate Federating as CommonsFederating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User
```
