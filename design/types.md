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

instantiate Posting with
  Author is Registering.User
  Work is TimelapseNumber

instantiate Following with
  Person is Registering.User

instantiate Liking with
  Person is Registering.User
  Item is Posting.Post
```

Artists follow other registered users, and they like posts. Following and Liking store only identities. The [people composition](compositions/sharing/people.md) turns a typed username into a user, and the [sharing composition](compositions/sharing/posts.md) clears a post's likes when it is retracted.

Posting shares completed timelapses. TimeLapsing numbers each artist's completed recordings from 1, so a post's author and work together name exactly one recording. Posting never reads TimeLapsing. The [sharing composition](compositions/sharing/posts.md) checks that the recording exists before publishing and reads its strokes for viewers.

```types
concrete TimelapseNumber
  The index TimeLapsing gives one of an author's completed recordings. It is meaningful only together with that author.
```
