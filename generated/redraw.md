<!-- Generated from the Redraw assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Redraw — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `set(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_PASSWORD`: A password must have 8 to 128 characters.
  - Refuses `PASSWORD_SET`: This account already has a password.
- `authenticate(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_acceptable(password: String) : one (acceptable: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [Application types](../design/types.md), line 10.
  - `User` is `Registering.User` — [Application types](../design/types.md), line 11.

### CoverageTracking

Defined in [CoverageTracking](../design/concepts/CoverageTracking.md), line 1.

#### Actions

- `record(artist: Artist, key: String, fundamentals: Set<Fundamental>) : returns ()`
  - Refuses `NO_FUNDAMENTALS`: A practice must exercise at least one fundamental.
  - Refuses `PRACTICE_KEY_REUSED`: This practice has already been recorded with different fundamentals.

#### Queries

- `_coverage(artist: Artist, fundamentals: Set<Fundamental>) : many (fundamental: Fundamental, count: Number)`

#### Instances

- `CoverageTracking` — instance of `CoverageTracking` — [Application types](../design/types.md), line 36.
  - `Artist` is `Registering.User` — [Application types](../design/types.md), line 37.
  - `Fundamental` is `FundamentalName` — [Application types](../design/types.md), line 38.

### Federating

Defined in [Federating](../design/concepts/Federating.md), line 1.

#### Actions

- `start() : returns (attempt: Attempt, expiresAt: DateTime, address: String)`
- `finish(attempt: Attempt, nonce: String, code: String) : returns (username: String)`
  - Refuses `SIGN_IN_EXPIRED`: This sign-in has expired. Start again.
  - Refuses `SIGN_IN_REFUSED`: The other site didn't confirm this sign-in. Start again.
- `link(attempt: Attempt, user: User) : returns (user: User)`
  - Refuses `NOT_CONFIRMED`: This sign-in hasn't been confirmed.
  - Refuses `ALREADY_LINKED`: This account on the other site is already linked.

#### Queries

- `_user(attempt: Attempt) : optional (user: User)`
- `_linkable(attempt: Attempt) : one (linkable: Flag)`

#### Instances

- `CommonsFederating` — instance of `Federating` — [Application types](../design/types.md), line 13.
  - `User` is `Registering.User` — [Application types](../design/types.md), line 14.

### Following

Defined in [Following](../design/concepts/Following.md), line 1.

#### Actions

- `follow(follower: Person, followee: Person) : returns ()`
  - Refuses `CANNOT_FOLLOW_SELF`: You cannot follow yourself.
  - Refuses `ALREADY_FOLLOWING`: You already follow this person.
- `unfollow(follower: Person, followee: Person) : returns ()`
  - Refuses `NOT_FOLLOWING`: You do not follow this person.

#### Queries

- `_following(follower: Person) : many (followee: Person, since: Number)`
- `_isFollowing(follower: Person, followee: Person) : one (following: Flag)`
- `_followerCount(followee: Person) : one (count: Number)`

#### Instances

- `Following` — instance of `Following` — [Application types](../design/types.md), line 26.
  - `Person` is `Registering.User` — [Application types](../design/types.md), line 27.

### Liking

Defined in [Liking](../design/concepts/Liking.md), line 1.

#### Actions

- `like(person: Person, item: Item) : returns ()`
  - Refuses `ALREADY_LIKED`: You already like this.
- `unlike(person: Person, item: Item) : returns ()`
  - Refuses `NOT_LIKED`: You have not liked this.
- `forget(item: Item) : returns ()`

#### Queries

- `_count(item: Item) : one (count: Number)`
- `_likes(person: Person, item: Item) : one (liked: Flag)`

#### Instances

- `Liking` — instance of `Liking` — [Application types](../design/types.md), line 29.
  - `Item` is `Posting.Post` — [Application types](../design/types.md), line 31.
  - `Person` is `Registering.User` — [Application types](../design/types.md), line 30.

### Posting

Defined in [Posting](../design/concepts/Posting.md), line 1.

#### Actions

- `publish(author: Author, work: Work) : returns (post: Post)`
  - Refuses `ALREADY_PUBLISHED`: You have already shared this piece.
- `retract(author: Author, post: Post) : returns (post: Post)`
  - Refuses `POST_NOT_FOUND`: There is no such post.

#### Queries

- `_feed(before: String) : many (post: Post, author: Author, work: Work, createdAt: Number)`
- `_get(post: Post) : optional (author: Author, work: Work, createdAt: Number)`
- `_publishedAs(author: Author, work: Work) : optional (post: Post)`
- `_authors() : many (author: Author, posts: Number, latest: Number)`

#### Instances

- `Posting` — instance of `Posting` — [Application types](../design/types.md), line 22.
  - `Author` is `Registering.User` — [Application types](../design/types.md), line 23.
  - `Work` is `TimelapseNumber` — [Application types](../design/types.md), line 24.

### Practicing

Defined in [Practicing](../design/concepts/Practicing.md), line 1.

#### Actions

- `begin(artist: Artist, fundamental: Fundamental, image: String, source: String, credit: String) : returns (fundamental: Fundamental, image: String, source: String, credit: String, started: Flag, startedAt: Number)`
  - Refuses `INVALID_ATTEMPT`: A practice needs one fundamental and a reference.
- `start(artist: Artist, instant: DateTime) : returns (startedAt: Number)`
  - Refuses `INVALID_ATTEMPT`: A practice needs one fundamental and a reference.
  - Refuses `NOT_PRACTICING`: There is no practice to time.
- `end(artist: Artist) : returns ()`

#### Queries

- `_current(artist: Artist) : one (practicing: Flag, fundamental: Fundamental, image: String, source: String, credit: String, started: Flag, startedAt: Number)`

#### Instances

- `Practicing` — instance of `Practicing` — [Application types](../design/types.md), line 44.
  - `Artist` is `Registering.User` — [Application types](../design/types.md), line 45.
  - `Fundamental` is `FundamentalName` — [Application types](../design/types.md), line 46.

### ReferencePhotoBinning

Defined in [ReferencePhotoBinning](../design/concepts/ReferencePhotoBinning.md), line 1.

#### Actions

- `appoint(admin: Admin, curator: Admin) : returns ()`
  - Refuses `FIRST_CURATOR`: The first curator must appoint themself.
  - Refuses `NOT_CURATOR`: Only a curator can change the reference bank.
  - Refuses `ALREADY_CURATOR`: This person is already a curator.
- `add(admin: Admin, key: String, source: String, credit: String, tags: Set<Fundamental>) : returns (image: String)`
  - Refuses `NOT_CURATOR`: Only a curator can change the reference bank.
  - Refuses `INVALID_IMAGE`: The image needs a key, a source, a credit, and one to eight tags.
  - Refuses `IMAGE_KEY_REUSED`: This image identifier has already been used.
  - Refuses `SOURCE_REUSED`: This reference is already in the bank.
- `provide(key: String, source: String, credit: String, tags: Set<Fundamental>) : returns (image: String)`
  - Refuses `INVALID_IMAGE`: The image needs a key, a source, a credit, and one to eight tags.
  - Refuses `IMAGE_KEY_REUSED`: This image identifier has already been used.
  - Refuses `SOURCE_REUSED`: This reference is already in the bank.
- `remove(admin: Admin, image: String) : returns ()`
  - Refuses `NOT_CURATOR`: Only a curator can change the reference bank.
  - Refuses `IMAGE_NOT_FOUND`: That reference is not in the bank.
- `tag(admin: Admin, image: String, tags: Set<Fundamental>) : returns ()`
  - Refuses `NOT_CURATOR`: Only a curator can change the reference bank.
  - Refuses `INVALID_IMAGE`: A reference needs one to eight tags.
  - Refuses `IMAGE_NOT_FOUND`: That reference is not in the bank.
- `request(day: Number, fundamental: Fundamental) : returns (found: Flag, image: String, source: String, credit: String)`

#### Queries

- `_catalog() : one (images: Catalog)`
- `_curator(admin: Admin) : one (curator: Flag)`
- `_vacant() : one (vacant: Flag)`

#### Instances

- `ReferencePhotoBinning` — instance of `ReferencePhotoBinning` — [Application types](../design/types.md), line 40.
  - `Admin` is `Registering.User` — [Application types](../design/types.md), line 41.
  - `Fundamental` is `FundamentalName` — [Application types](../design/types.md), line 42.

### Registering

Defined in [Registering](../design/concepts/Registering.md), line 1.

#### Actions

- `register(username: String) : returns (user: User)`
  - Refuses `INVALID_USERNAME`: A username must have 3 to 32 letters, digits, underscores, or hyphens.
  - Refuses `USERNAME_TAKEN`: That username is taken.

#### Queries

- `_byUsername(username: String) : optional (user: User)`
- `_username(user: User) : optional (username: String)`
- `_search(prefix: String) : many (user: User, username: String)`

#### Instances

- `Registering` — instance of `Registering` — [Application types](../design/types.md), line 8.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `use(session: Session) : returns (subject: Subject)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.
- `end(session: Session) : returns (session: Session)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.

#### Instances

- `Sessioning` — instance of `Sessioning` — [Application types](../design/types.md), line 16.
  - `Subject` is `Registering.User` — [Application types](../design/types.md), line 17.

### StreakTracking

Defined in [StreakTracking](../design/concepts/StreakTracking.md), line 1.

#### Actions

- `engage(user: User, period: Number) : returns (streakCount: Number)`
  - Refuses `INVALID_PERIOD`: The period is not valid.
  - Refuses `STALE_PERIOD`: This period has already passed.
- `expire(user: User, period: Number) : returns (streakCount: Number)`
  - Refuses `INVALID_PERIOD`: The period is not valid.

#### Queries

- `_getStreak(user: User) : one (streakCount: Number)`

#### Instances

- `StreakTracking` — instance of `StreakTracking` — [Application types](../design/types.md), line 33.
  - `User` is `Registering.User` — [Application types](../design/types.md), line 34.

### TimeLapsing

Defined in [TimeLapsing](../design/concepts/TimeLapsing.md), line 1.

#### Actions

- `addUpdate(owner: Owner, key: String, sequence: Number, change: String, timestamp: Number) : returns (sequence: Number)`
  - Refuses `INVALID_UPDATE`: The update is not valid.
  - Refuses `UPDATE_KEY_REUSED`: This update identifier has already been used.
  - Refuses `STALE_HISTORY`: Load the latest history before adding this update.
- `complete(owner: Owner, key: String, sequence: Number, image: String) : returns (index: Number, sequence: Number)`
  - Refuses `INVALID_COMPLETION`: The completion is not valid.
  - Refuses `UPDATE_KEY_REUSED`: This update identifier has already been used.
  - Refuses `STALE_HISTORY`: Load the latest history before adding this update.
  - Refuses `EMPTY_HISTORY`: There are no updates to complete.
- `undo(owner: Owner, key: String, sequence: Number, timestamp: Number) : returns (sequence: Number, removed: String)`
  - Refuses `INVALID_UPDATE`: The update is not valid.
  - Refuses `UPDATE_KEY_REUSED`: This update identifier has already been used.
  - Refuses `STALE_HISTORY`: Load the latest history before adding this update.
  - Refuses `NOTHING_TO_UNDO`: There is no stroke to undo.
- `redo(owner: Owner, key: String, sequence: Number, timestamp: Number) : returns (sequence: Number, key: String, change: String, timestamp: Number)`
  - Refuses `INVALID_UPDATE`: The update is not valid.
  - Refuses `UPDATE_KEY_REUSED`: This update identifier has already been used.
  - Refuses `STALE_HISTORY`: Load the latest history before adding this update.
  - Refuses `NOTHING_TO_REDO`: There is no stroke to redo.
- `abandon(owner: Owner) : returns ()`

#### Queries

- `_history(owner: Owner, after: Number) : one (start: Number, tip: Number, updates: History, redo: Number)`
- `_picture(owner: Owner, index: Number) : one (found: Flag, image: String)`
- `_recordings(owner: Owner, after: Number) : one (recordings: Recordings)`
- `_recording(owner: Owner, index: Number, after: Number) : one (found: Flag, updates: History)`

#### Instances

- `TimeLapsing` — instance of `TimeLapsing` — [Application types](../design/types.md), line 19.
  - `Owner` is `Registering.User` — [Application types](../design/types.md), line 20.

## Application types

Concrete types:

- `FundamentalName` — [Application types](../design/types.md), line 61.
- `TimelapseNumber` — [Application types](../design/types.md), line 58.

## Computations

- `easternDay(instant: DateTime) : Number` — [Reference bank](../design/compositions/practice/references.md), line 4.
- `easternWeek(instant: DateTime) : Number` — [Weekly streaks](../design/compositions/practice/streaks.md), line 6.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### artists matching (prefix) for (viewer)

Authored path: `sharing.people.SearchResults`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 24.

```former
Former "artists matching (prefix) for (viewer)" — inputs (prefix, viewer); bindings (user, username, following, followers, me); promises exactly one record — forms:
  a record of
    people: each Registering._search (prefix) has (user, username)
      where Registering._username (user: viewer) has (username: me)
      where Registering._username (user) and not (username: me)
      where Following._isFollowing (followee: user, follower: viewer) has (following)
      where Following._followerCount (followee: user) has (count: followers)
      form a record of
        followers
        following
        username
```

### artists to suggest to (viewer)

Authored path: `sharing.people.SuggestionList`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 18.

```former
Former "artists to suggest to (viewer)" — inputs (viewer); bindings (author, posts, latest, username, followers, me); promises exactly one record — forms:
  a record of
    people: each Posting._authors () has (author, latest, posts)
      where Registering._username (user: viewer) has (username: me)
      where Registering._username (user: author) has (username)
      where Registering._username (user: author) and not (username: me)
      where Following._isFollowing (followee: author, follower: viewer) has (following: false)
      where Following._followerCount (followee: author) has (count: followers)
      form a record of
        followers
        latest
        posts
        username
```

### the feed page before (before) for (viewer)

Authored path: `sharing.posts.FeedPage`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 32.

```former
Former "the feed page before (before) for (viewer)" — inputs (before, viewer); bindings (post, author, work, createdAt, username, likes, liked, following); promises exactly one record — forms:
  a record of
    posts: each Posting._feed (before) has (author, createdAt, post, work)
      where whether Registering._username (user: author) has (username)
      where Liking._count (item: post) has (count: likes)
      where Liking._likes (item: post, person: viewer) has (liked)
      where Following._isFollowing (followee: author, follower: viewer) has (following)
      form a record of
        createdAt
        following
        index: work
        liked
        likes
        post
        username
```

### the people (follower) follows

Authored path: `sharing.people.FollowingList`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 12.

```former
Former "the people (follower) follows" — inputs (follower); bindings (followee, since, username); promises exactly one record — forms:
  a record of
    people: each Following._following (follower) has (followee, since)
      where Registering._username (user: followee) has (username)
      form a record of
        since
        username
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### drawing.canvas.History

Authored path: `drawing.canvas.History`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 3.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 6.

```reaction
when RequestBoundary.request (after, path: "/canvas/history", requestId, session)
then
  Sessioning.use (session)
```

### drawing.canvas.History#2

Authored path: `drawing.canvas.History`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 3.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 6.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.History
where
  earlier, RequestBoundary.request (after, path: "/canvas/history", requestId, session)
  TimeLapsing._history (after, owner) has (redo, start, tip, updates)
then
  RequestBoundary.respond (redo, requestId, start, tip, updates)
```

### drawing.canvas.Picture

Authored path: `drawing.canvas.Picture`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 11.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 22.

```reaction
when RequestBoundary.request (index, path: "/canvas/picture", requestId, session)
then
  Sessioning.use (session)
```

### drawing.canvas.Picture#2

Authored path: `drawing.canvas.Picture`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 11.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 22.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Picture
where
  earlier, RequestBoundary.request (index, path: "/canvas/picture", requestId, session)
  TimeLapsing._picture (index, owner) has (found, image)
then
  RequestBoundary.respond (found, image, requestId)
```

### drawing.canvas.Redo

Authored path: `drawing.canvas.Redo`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 9.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 20.

```reaction
when RequestBoundary.request (key, path: "/canvas/redo", requestId, sequence, session, timestamp)
then
  Sessioning.use (session)
```

### drawing.canvas.Redo#2

Authored path: `drawing.canvas.Redo`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 9.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 20.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Redo
where
  earlier, RequestBoundary.request (key, path: "/canvas/redo", requestId, sequence, session, timestamp)
then
  TimeLapsing.redo (key, owner, sequence, timestamp)
```

### drawing.canvas.Redo#3

Authored path: `drawing.canvas.Redo`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 9.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 20.

```reaction
when TimeLapsing.redo (key, owner, sequence, timestamp, change, result.key: restored, result.sequence: saved, result.timestamp: occurred), asked by drawing.canvas.Redo#2
where
  earlier, RequestBoundary.request (key, path: "/canvas/redo", requestId, sequence, session, timestamp)
then
  RequestBoundary.respond (change, key: restored, requestId, sequence: saved, timestamp: occurred)
```

### drawing.canvas.Stroke

Authored path: `drawing.canvas.Stroke`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 3.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 7.

```reaction
when RequestBoundary.request (change, key, path: "/canvas/stroke", requestId, sequence, session, timestamp)
then
  Sessioning.use (session)
```

### drawing.canvas.Stroke#2

Authored path: `drawing.canvas.Stroke`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 3.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 7.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Stroke
where
  earlier, RequestBoundary.request (change, key, path: "/canvas/stroke", requestId, sequence, session, timestamp)
then
  TimeLapsing.addUpdate (change, key, owner, sequence, timestamp)
```

### drawing.canvas.Stroke#3

Authored path: `drawing.canvas.Stroke`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 3.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 7.

```reaction
when TimeLapsing.addUpdate (change, key, owner, sequence, timestamp, result.sequence: saved), asked by drawing.canvas.Stroke#2
where
  earlier, RequestBoundary.request (change, key, path: "/canvas/stroke", requestId, sequence, session, timestamp)
then
  RequestBoundary.respond (requestId, sequence: saved)
```

### drawing.canvas.Submit

Authored path: `drawing.canvas.Submit`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 10.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 22.

```reaction
when RequestBoundary.request (image, key, path: "/canvas/submit", requestId, sequence, session)
then
  Sessioning.use (session)
```

### drawing.canvas.Submit#2

Authored path: `drawing.canvas.Submit`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 10.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 22.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Submit
where
  earlier, RequestBoundary.request (image, key, path: "/canvas/submit", requestId, sequence, session)
then
  TimeLapsing.complete (image, key, owner, sequence)
```

### drawing.canvas.Submit#3

Authored path: `drawing.canvas.Submit`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 10.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 22.

```reaction
when TimeLapsing.complete (image, key, owner, sequence, index, result.sequence: saved), asked by drawing.canvas.Submit#2
where
  earlier, RequestBoundary.request (image, key, path: "/canvas/submit", requestId, sequence, session)
then
  RequestBoundary.respond (index, requestId, sequence: saved)
```

### drawing.canvas.Timelapse

Authored path: `drawing.canvas.Timelapse`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 13.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 24.

```reaction
when RequestBoundary.request (after, index, path: "/canvas/timelapse", requestId, session)
then
  Sessioning.use (session)
```

### drawing.canvas.Timelapse#2

Authored path: `drawing.canvas.Timelapse`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 13.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 24.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Timelapse
where
  earlier, RequestBoundary.request (after, index, path: "/canvas/timelapse", requestId, session)
  TimeLapsing._recording (after, index, owner) has (found, updates)
then
  RequestBoundary.respond (found, requestId, updates)
```

### drawing.canvas.Timelapses

Authored path: `drawing.canvas.Timelapses`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 12.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 24.

```reaction
when RequestBoundary.request (after, path: "/canvas/timelapses", requestId, session)
then
  Sessioning.use (session)
```

### drawing.canvas.Timelapses#2

Authored path: `drawing.canvas.Timelapses`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 12.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 24.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Timelapses
where
  earlier, RequestBoundary.request (after, path: "/canvas/timelapses", requestId, session)
  TimeLapsing._recordings (after, owner) has (recordings)
then
  RequestBoundary.respond (recordings, requestId)
```

### drawing.canvas.Undo

Authored path: `drawing.canvas.Undo`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 8.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 20.

```reaction
when RequestBoundary.request (key, path: "/canvas/undo", requestId, sequence, session, timestamp)
then
  Sessioning.use (session)
```

### drawing.canvas.Undo#2

Authored path: `drawing.canvas.Undo`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 8.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 20.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Undo
where
  earlier, RequestBoundary.request (key, path: "/canvas/undo", requestId, sequence, session, timestamp)
then
  TimeLapsing.undo (key, owner, sequence, timestamp)
```

### drawing.canvas.Undo#3

Authored path: `drawing.canvas.Undo`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 8.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 20.

```reaction
when TimeLapsing.undo (key, owner, sequence, timestamp, removed, result.sequence: saved), asked by drawing.canvas.Undo#2
where
  earlier, RequestBoundary.request (key, path: "/canvas/undo", requestId, sequence, session, timestamp)
then
  RequestBoundary.respond (removed, requestId, sequence: saved)
```

### practice.practicing.Begin

Authored path: `practice.practicing.Begin`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 3.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 13.

```reaction
when RequestBoundary.request (fundamental, path: "/practice/begin", requestId, session)
then
  Sessioning.use (session)
```

### practice.practicing.Begin#2

Authored path: `practice.practicing.Begin`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 3.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 13.

```reaction
when Sessioning.use (session, subject: artist), asked by practice.practicing.Begin
where
  instant is the current flow's instant
  day is easternDay (instant)
  earlier, RequestBoundary.request (fundamental, path: "/practice/begin", requestId, session)
then
  ReferencePhotoBinning.request (day, fundamental)
```

### practice.practicing.Begin#3

Authored path: `practice.practicing.Begin`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 3.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 13.

```reaction
when ReferencePhotoBinning.request (day, fundamental, credit, image, source), asked by practice.practicing.Begin#2
where
  earlier, Sessioning.use (session, subject: artist), asked by practice.practicing.Begin
then
  Practicing.begin (artist, credit, fundamental, image, source)
```

### practice.practicing.Begin#4

Authored path: `practice.practicing.Begin`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 3.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 13.

```reaction
when Practicing.begin (artist, credit, fundamental, image, source, started, startedAt), asked by practice.practicing.Begin#3
where
  earlier, RequestBoundary.request (fundamental, path: "/practice/begin", requestId, session)
then
  RequestBoundary.respond (credit, fundamental, image, requestId, source, started, startedAt)
```

### practice.practicing.Current

Authored path: `practice.practicing.Current`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 3.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 12.

```reaction
when RequestBoundary.request (path: "/practice/current", requestId, session)
then
  Sessioning.use (session)
```

### practice.practicing.Current#2

Authored path: `practice.practicing.Current`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 3.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 12.

```reaction
when Sessioning.use (session, subject: artist), asked by practice.practicing.Current
where
  Practicing._current (artist) has (credit, fundamental, image, practicing, source, started, startedAt)
  earlier, RequestBoundary.request (path: "/practice/current", requestId, session)
then
  RequestBoundary.respond (credit, fundamental, image, practicing, requestId, source, started, startedAt)
```

### practice.practicing.Discard

Authored path: `practice.practicing.Discard`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 7.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 15.

```reaction
when RequestBoundary.request (path: "/practice/discard", requestId, session)
then
  Sessioning.use (session)
```

### practice.practicing.Discard#2

Authored path: `practice.practicing.Discard`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 7.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 15.

```reaction
when Sessioning.use (session, subject: artist), asked by practice.practicing.Discard
then
  TimeLapsing.abandon (owner: artist)
```

### practice.practicing.Discard#3

Authored path: `practice.practicing.Discard`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 7.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 15.

```reaction
when TimeLapsing.abandon (owner: artist), asked by practice.practicing.Discard#2
then
  Practicing.end (artist)
```

### practice.practicing.Discard#4

Authored path: `practice.practicing.Discard`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 7.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 15.

```reaction
when Practicing.end (artist), asked by practice.practicing.Discard#3
where
  earlier, RequestBoundary.request (path: "/practice/discard", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### practice.practicing.Start

Authored path: `practice.practicing.Start`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 5.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 14.

```reaction
when RequestBoundary.request (path: "/practice/start", requestId, session)
then
  Sessioning.use (session)
```

### practice.practicing.Start#2

Authored path: `practice.practicing.Start`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 5.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 14.

```reaction
when Sessioning.use (session, subject: artist), asked by practice.practicing.Start
where
  instant is the current flow's instant
then
  Practicing.start (artist, instant)
```

### practice.practicing.Start#3

Authored path: `practice.practicing.Start`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 5.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 14.

```reaction
when Practicing.start (artist, instant, startedAt), asked by practice.practicing.Start#2
where
  earlier, RequestBoundary.request (path: "/practice/start", requestId, session)
then
  RequestBoundary.respond (requestId, startedAt)
```

### practice.practicing.SubmitEndsPractice

Authored path: `practice.practicing.SubmitEndsPractice`.
- Covered by [Drawing session](../design/compositions/practice/practicing.md), line 7.

```reaction
when TimeLapsing.complete (owner)
then
  Practicing.end (artist: owner)
```

### practice.references.Access

Authored path: `practice.references.Access`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 29.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 38.

```reaction
when RequestBoundary.request (path: "/references/access", requestId, session)
then
  Sessioning.use (session)
```

### practice.references.Access#2

Authored path: `practice.references.Access`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 29.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 38.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Access
where
  ReferencePhotoBinning._curator (admin) has (curator)
  ReferencePhotoBinning._vacant () has (vacant)
  earlier, RequestBoundary.request (path: "/references/access", requestId, session)
then
  RequestBoundary.respond (curator, requestId, vacant)
```

### practice.references.Add

Authored path: `practice.references.Add`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 16.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 19.

```reaction
when RequestBoundary.request (credit, key, path: "/references/add", requestId, session, source, tags)
then
  Sessioning.use (session)
```

### practice.references.Add#2

Authored path: `practice.references.Add`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 16.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 19.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Add
where
  earlier, RequestBoundary.request (credit, key, path: "/references/add", requestId, session, source, tags)
then
  ReferencePhotoBinning.add (admin, credit, key, source, tags)
```

### practice.references.Add#3

Authored path: `practice.references.Add`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 16.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 19.

```reaction
when ReferencePhotoBinning.add (admin, credit, key, source, tags, image), asked by practice.references.Add#2
where
  earlier, RequestBoundary.request (credit, key, path: "/references/add", requestId, session, source, tags)
then
  RequestBoundary.respond (image, requestId)
```

### practice.references.Appoint

Authored path: `practice.references.Appoint`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 10.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 13.

```reaction
when RequestBoundary.request (path: "/references/appoint", requestId, session, username)
then
  Sessioning.use (session)
```

### practice.references.Appoint:known#2

Authored path: `practice.references.Appoint`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 10.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 13.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Appoint
where
  earlier, RequestBoundary.request (path: "/references/appoint", requestId, session, username)
  Registering._byUsername (username) has (user: curator)
then
  ReferencePhotoBinning.appoint (admin, curator)
```

### practice.references.Appoint:known#3

Authored path: `practice.references.Appoint`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 10.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 13.

```reaction
when ReferencePhotoBinning.appoint (admin, curator), asked by practice.references.Appoint:known#2
where
  earlier, RequestBoundary.request (path: "/references/appoint", requestId, session, username)
then
  RequestBoundary.respond (requestId)
```

### practice.references.Appoint:unknown#2

Authored path: `practice.references.Appoint`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 10.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 13.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Appoint
where
  earlier, RequestBoundary.request (path: "/references/appoint", requestId, session, username)
  no Registering._byUsername (username)
then
  RequestBoundary.respond (error: "USER_NOT_FOUND", requestId)
```

### practice.references.Catalog

Authored path: `practice.references.Catalog`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 31.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 39.

```reaction
when RequestBoundary.request (path: "/references/catalog", requestId, session)
then
  Sessioning.use (session)
```

### practice.references.Catalog:curator#2

Authored path: `practice.references.Catalog`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 31.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 39.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Catalog
where
  ReferencePhotoBinning._curator (admin) has (curator: true)
  ReferencePhotoBinning._catalog () has (images)
  earlier, RequestBoundary.request (path: "/references/catalog", requestId, session)
then
  RequestBoundary.respond (images, requestId)
```

### practice.references.Catalog:visitor#2

Authored path: `practice.references.Catalog`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 31.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 39.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Catalog
where
  ReferencePhotoBinning._curator (admin) has (curator: false)
  earlier, RequestBoundary.request (path: "/references/catalog", requestId, session)
then
  RequestBoundary.respond (error: "NOT_CURATOR", requestId)
```

### practice.references.Remove

Authored path: `practice.references.Remove`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 22.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 25.

```reaction
when RequestBoundary.request (image, path: "/references/remove", requestId, session)
then
  Sessioning.use (session)
```

### practice.references.Remove#2

Authored path: `practice.references.Remove`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 22.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 25.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Remove
where
  earlier, RequestBoundary.request (image, path: "/references/remove", requestId, session)
then
  ReferencePhotoBinning.remove (admin, image)
```

### practice.references.Remove#3

Authored path: `practice.references.Remove`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 22.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 25.

```reaction
when ReferencePhotoBinning.remove (admin, image), asked by practice.references.Remove#2
where
  earlier, RequestBoundary.request (image, path: "/references/remove", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### practice.references.Request

Authored path: `practice.references.Request`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 35.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 40.

```reaction
when RequestBoundary.request (fundamental, path: "/references/request", requestId, session)
then
  Sessioning.use (session)
```

### practice.references.Request#2

Authored path: `practice.references.Request`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 35.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 40.

```reaction
when Sessioning.use (session), asked by practice.references.Request
where
  instant is the current flow's instant
  day is easternDay (instant)
  earlier, RequestBoundary.request (fundamental, path: "/references/request", requestId, session)
then
  ReferencePhotoBinning.request (day, fundamental)
```

### practice.references.Request#3

Authored path: `practice.references.Request`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 35.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 40.

```reaction
when ReferencePhotoBinning.request (day, fundamental, credit, found, image, source), asked by practice.references.Request#2
where
  earlier, RequestBoundary.request (fundamental, path: "/references/request", requestId, session)
then
  RequestBoundary.respond (credit, found, image, requestId, source)
```

### practice.references.Tag

Authored path: `practice.references.Tag`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 22.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 26.

```reaction
when RequestBoundary.request (image, path: "/references/tag", requestId, session, tags)
then
  Sessioning.use (session)
```

### practice.references.Tag#2

Authored path: `practice.references.Tag`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 22.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 26.

```reaction
when Sessioning.use (session, subject: admin), asked by practice.references.Tag
where
  earlier, RequestBoundary.request (image, path: "/references/tag", requestId, session, tags)
then
  ReferencePhotoBinning.tag (admin, image, tags)
```

### practice.references.Tag#3

Authored path: `practice.references.Tag`.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 22.
- Covered by [Reference bank](../design/compositions/practice/references.md), line 26.

```reaction
when ReferencePhotoBinning.tag (admin, image, tags), asked by practice.references.Tag#2
where
  earlier, RequestBoundary.request (image, path: "/references/tag", requestId, session, tags)
then
  RequestBoundary.respond (requestId)
```

### practice.streaks.Current

Authored path: `practice.streaks.Current`.
- Covered by [Weekly streaks](../design/compositions/practice/streaks.md), line 12.
- Covered by [Weekly streaks](../design/compositions/practice/streaks.md), line 15.

```reaction
when RequestBoundary.request (path: "/streaks/current", requestId, session)
then
  Sessioning.use (session)
```

### practice.streaks.Current#2

Authored path: `practice.streaks.Current`.
- Covered by [Weekly streaks](../design/compositions/practice/streaks.md), line 12.
- Covered by [Weekly streaks](../design/compositions/practice/streaks.md), line 15.

```reaction
when Sessioning.use (session, subject: user), asked by practice.streaks.Current
where
  instant is the current flow's instant
  week is easternWeek (instant)
then
  StreakTracking.expire (period: week, user)
```

### practice.streaks.Current#3

Authored path: `practice.streaks.Current`.
- Covered by [Weekly streaks](../design/compositions/practice/streaks.md), line 12.
- Covered by [Weekly streaks](../design/compositions/practice/streaks.md), line 15.

```reaction
when StreakTracking.expire (period: week, user, streakCount), asked by practice.streaks.Current#2
where
  earlier, RequestBoundary.request (path: "/streaks/current", requestId, session)
then
  RequestBoundary.respond (requestId, streakCount)
```

### practice.streaks.SubmitEngagesStreak

Authored path: `practice.streaks.SubmitEngagesStreak`.
- Covered by [Weekly streaks](../design/compositions/practice/streaks.md), line 10.

```reaction
when TimeLapsing.complete (owner)
where
  instant is the current flow's instant
  week is easternWeek (instant)
then
  StreakTracking.engage (period: week, user: owner)
```

### reusable.accounts.identifying.Me

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when RequestBoundary.request (path: "/auth/me", requestId, session)
then
  Sessioning.use (session)
```

### reusable.accounts.identifying.Me#2

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by reusable.accounts.identifying.Me
where
  Registering._username (user) has (username)
  earlier, RequestBoundary.request (path: "/auth/me", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### reusable.accounts.leaving.SignOut

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Sessioning.end (session)
```

### reusable.accounts.leaving.SignOut#2

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when Sessioning.end (session), asked by reusable.accounts.leaving.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### reusable.commons.finishing.ChooseUsername:expired

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
where
  CommonsFederating._linkable (attempt) has (linkable: false)
then
  RequestBoundary.respond (error: "SIGN_IN_EXPIRED", requestId)
```

### reusable.commons.finishing.ChooseUsername:linkable

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
where
  CommonsFederating._linkable (attempt) has (linkable: true)
then
  Registering.register (username)
```

### reusable.commons.finishing.ChooseUsername:linkable#2

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when Registering.register (username, user), asked by reusable.commons.finishing.ChooseUsername:linkable
where
  earlier, RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
then
  CommonsFederating.link (attempt, user)
```

### reusable.commons.finishing.ChooseUsername:linkable#3

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when CommonsFederating.link (attempt, user), asked by reusable.commons.finishing.ChooseUsername:linkable#2
then
  Sessioning.start (subject: user)
```

### reusable.commons.finishing.ChooseUsername:linkable#4

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.commons.finishing.ChooseUsername:linkable#3
where
  earlier, RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.commons.finishing.FinishCommons

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  CommonsFederating.finish (attempt, code, nonce: state)
```

### reusable.commons.finishing.FinishCommons:new#2

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when CommonsFederating.finish (attempt, code, nonce: state, username), asked by reusable.commons.finishing.FinishCommons
where
  no CommonsFederating._user (attempt)
then
  Registering.register (username)
```

### reusable.commons.finishing.FinishCommons:new#3

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when Registering.register (username, user), asked by reusable.commons.finishing.FinishCommons:new#2
where
  earlier, CommonsFederating.finish (attempt, code, nonce: state, username), asked by reusable.commons.finishing.FinishCommons
then
  CommonsFederating.link (attempt, user)
```

### reusable.commons.finishing.FinishCommons:new#4

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when CommonsFederating.link (attempt, user), asked by reusable.commons.finishing.FinishCommons:new#3
then
  Sessioning.start (subject: user)
```

### reusable.commons.finishing.FinishCommons:new#5

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.commons.finishing.FinishCommons:new#4
where
  earlier, RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.commons.finishing.FinishCommons:returning#2

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when CommonsFederating.finish (attempt, code, nonce: state, username), asked by reusable.commons.finishing.FinishCommons
where
  CommonsFederating._user (attempt) has (user)
then
  Sessioning.start (subject: user)
```

### reusable.commons.finishing.FinishCommons:returning#3

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.commons.finishing.FinishCommons:returning#2
where
  earlier, RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.commons.starting.StartCommons

Authored path: `reusable.commons.starting.StartCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 7.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 10.

```reaction
when RequestBoundary.request (path: "/auth/commons/start", requestId)
then
  CommonsFederating.start ()
```

### reusable.commons.starting.StartCommons#2

Authored path: `reusable.commons.starting.StartCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 7.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 10.

```reaction
when CommonsFederating.start (address, attempt, expiresAt), asked by reusable.commons.starting.StartCommons
where
  earlier, RequestBoundary.request (path: "/auth/commons/start", requestId)
then
  RequestBoundary.respond (address, attempt, expiresAt, requestId)
```

### reusable.passwords.entering.Register:accepted

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: true)
then
  Registering.register (username)
```

### reusable.passwords.entering.Register:accepted#2

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Registering.register (username, user), asked by reusable.passwords.entering.Register:accepted
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.set (password, user)
```

### reusable.passwords.entering.Register:accepted#3

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Authenticating.set (password, user), asked by reusable.passwords.entering.Register:accepted#2
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.Register:accepted#4

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.Register:accepted#3
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.Register:refused

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: false)
then
  RequestBoundary.respond (error: "INVALID_PASSWORD", requestId)
```

### reusable.passwords.entering.SignIn:known

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  Registering._byUsername (username) has (user)
then
  Authenticating.authenticate (password, user)
```

### reusable.passwords.entering.SignIn:known#2

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Authenticating.authenticate (password, user), asked by reusable.passwords.entering.SignIn:known
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.SignIn:known#3

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.SignIn:known#2
where
  earlier, RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.SignIn:unknown

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  no Registering._byUsername (username)
then
  RequestBoundary.respond (error: "INVALID_CREDENTIALS", requestId)
```

### sharing.people.Follow

Authored path: `sharing.people.Follow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 8.

```reaction
when RequestBoundary.request (path: "/people/follow", requestId, session, username)
then
  Sessioning.use (session)
```

### sharing.people.Follow:known#2

Authored path: `sharing.people.Follow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 8.

```reaction
when Sessioning.use (session, subject: follower), asked by sharing.people.Follow
where
  earlier, RequestBoundary.request (path: "/people/follow", requestId, session, username)
  Registering._byUsername (username) has (user: followee)
then
  Following.follow (followee, follower)
```

### sharing.people.Follow:known#3

Authored path: `sharing.people.Follow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 8.

```reaction
when Following.follow (followee, follower), asked by sharing.people.Follow:known#2
where
  earlier, RequestBoundary.request (path: "/people/follow", requestId, session, username)
then
  RequestBoundary.respond (requestId)
```

### sharing.people.Follow:unknown#2

Authored path: `sharing.people.Follow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 8.

```reaction
when Sessioning.use (session, subject: follower), asked by sharing.people.Follow
where
  earlier, RequestBoundary.request (path: "/people/follow", requestId, session, username)
  no Registering._byUsername (username)
then
  RequestBoundary.respond (error: "USER_NOT_FOUND", requestId)
```

### sharing.people.Followed

Authored path: `sharing.people.Followed`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 12.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 15.

```reaction
when RequestBoundary.request (path: "/people/following", requestId, session)
then
  Sessioning.use (session)
```

### sharing.people.Followed#2

Authored path: `sharing.people.Followed`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 12.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 15.

```reaction
when Sessioning.use (session, subject: follower), asked by sharing.people.Followed
where
  earlier, RequestBoundary.request (path: "/people/following", requestId, session)
then
  RequestBoundary.respond (following: former "the people (follower) follows" with (follower), requestId)
```

### sharing.people.Search

Authored path: `sharing.people.Search`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 24.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 27.

```reaction
when RequestBoundary.request (path: "/people/search", prefix, requestId, session)
then
  Sessioning.use (session)
```

### sharing.people.Search#2

Authored path: `sharing.people.Search`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 24.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 27.

```reaction
when Sessioning.use (session, subject: viewer), asked by sharing.people.Search
where
  earlier, RequestBoundary.request (path: "/people/search", prefix, requestId, session)
then
  RequestBoundary.respond (requestId, results: former "artists matching (prefix) for (viewer)" with (prefix, viewer))
```

### sharing.people.Suggestions

Authored path: `sharing.people.Suggestions`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 18.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 21.

```reaction
when RequestBoundary.request (path: "/people/suggestions", requestId, session)
then
  Sessioning.use (session)
```

### sharing.people.Suggestions#2

Authored path: `sharing.people.Suggestions`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 18.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 21.

```reaction
when Sessioning.use (session, subject: viewer), asked by sharing.people.Suggestions
where
  earlier, RequestBoundary.request (path: "/people/suggestions", requestId, session)
then
  RequestBoundary.respond (requestId, suggestions: former "artists to suggest to (viewer)" with (viewer))
```

### sharing.people.Unfollow

Authored path: `sharing.people.Unfollow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 9.

```reaction
when RequestBoundary.request (path: "/people/unfollow", requestId, session, username)
then
  Sessioning.use (session)
```

### sharing.people.Unfollow:known#2

Authored path: `sharing.people.Unfollow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 9.

```reaction
when Sessioning.use (session, subject: follower), asked by sharing.people.Unfollow
where
  earlier, RequestBoundary.request (path: "/people/unfollow", requestId, session, username)
  Registering._byUsername (username) has (user: followee)
then
  Following.unfollow (followee, follower)
```

### sharing.people.Unfollow:known#3

Authored path: `sharing.people.Unfollow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 9.

```reaction
when Following.unfollow (followee, follower), asked by sharing.people.Unfollow:known#2
where
  earlier, RequestBoundary.request (path: "/people/unfollow", requestId, session, username)
then
  RequestBoundary.respond (requestId)
```

### sharing.people.Unfollow:unknown#2

Authored path: `sharing.people.Unfollow`.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 5.
- Covered by [Following artists](../design/compositions/sharing/people.md), line 9.

```reaction
when Sessioning.use (session, subject: follower), asked by sharing.people.Unfollow
where
  earlier, RequestBoundary.request (path: "/people/unfollow", requestId, session, username)
  no Registering._byUsername (username)
then
  RequestBoundary.respond (error: "USER_NOT_FOUND", requestId)
```

### sharing.posts.Feed

Authored path: `sharing.posts.Feed`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 32.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 35.

```reaction
when RequestBoundary.request (before, path: "/posts/feed", requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Feed#2

Authored path: `sharing.posts.Feed`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 32.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 35.

```reaction
when Sessioning.use (session, subject: viewer), asked by sharing.posts.Feed
where
  earlier, RequestBoundary.request (before, path: "/posts/feed", requestId, session)
then
  RequestBoundary.respond (page: former "the feed page before (before) for (viewer)" with (before, viewer), requestId)
```

### sharing.posts.Like

Authored path: `sharing.posts.Like`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 19.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 22.

```reaction
when RequestBoundary.request (path: "/posts/like", post, requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Like:posted#2

Authored path: `sharing.posts.Like`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 19.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 22.

```reaction
when Sessioning.use (session, subject: person), asked by sharing.posts.Like
where
  earlier, RequestBoundary.request (path: "/posts/like", post, requestId, session)
  Posting._get (post)
then
  Liking.like (item: post, person)
```

### sharing.posts.Like:posted#3

Authored path: `sharing.posts.Like`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 19.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 22.

```reaction
when Liking.like (item: post, person), asked by sharing.posts.Like:posted#2
where
  earlier, RequestBoundary.request (path: "/posts/like", post, requestId, session)
then
  RequestBoundary.respond (requestId)
```

### sharing.posts.Like:unposted#2

Authored path: `sharing.posts.Like`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 19.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 22.

```reaction
when Sessioning.use (session, subject: person), asked by sharing.posts.Like
where
  earlier, RequestBoundary.request (path: "/posts/like", post, requestId, session)
  no Posting._get (post)
then
  RequestBoundary.respond (error: "POST_NOT_FOUND", requestId)
```

### sharing.posts.Picture

Authored path: `sharing.posts.Picture`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 44.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 47.

```reaction
when RequestBoundary.request (path: "/posts/picture", post, requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Picture:posted#2

Authored path: `sharing.posts.Picture`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 44.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 47.

```reaction
when Sessioning.use (session, subject: viewer), asked by sharing.posts.Picture
where
  earlier, RequestBoundary.request (path: "/posts/picture", post, requestId, session)
  Posting._get (post) has (author, work)
  TimeLapsing._picture (index: work, owner: author) has (found, image)
then
  RequestBoundary.respond (found, image, requestId)
```

### sharing.posts.Picture:unposted#2

Authored path: `sharing.posts.Picture`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 44.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 47.

```reaction
when Sessioning.use (session, subject: viewer), asked by sharing.posts.Picture
where
  earlier, RequestBoundary.request (path: "/posts/picture", post, requestId, session)
  no Posting._get (post)
then
  RequestBoundary.respond (found: false, image: "", requestId)
```

### sharing.posts.Publish

Authored path: `sharing.posts.Publish`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 5.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 8.

```reaction
when RequestBoundary.request (index, path: "/posts/publish", requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Publish:missing#2

Authored path: `sharing.posts.Publish`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 5.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 8.

```reaction
when Sessioning.use (session, subject: author), asked by sharing.posts.Publish
where
  earlier, RequestBoundary.request (index, path: "/posts/publish", requestId, session)
  TimeLapsing._recording (after: 0, index, owner: author) has (found: false)
then
  RequestBoundary.respond (error: "TIMELAPSE_NOT_FOUND", requestId)
```

### sharing.posts.Publish:recorded#2

Authored path: `sharing.posts.Publish`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 5.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 8.

```reaction
when Sessioning.use (session, subject: author), asked by sharing.posts.Publish
where
  earlier, RequestBoundary.request (index, path: "/posts/publish", requestId, session)
  TimeLapsing._recording (after: 0, index, owner: author) has (found: true)
then
  Posting.publish (author, work: index)
```

### sharing.posts.Publish:recorded#3

Authored path: `sharing.posts.Publish`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 5.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 8.

```reaction
when Posting.publish (author, work: index, post), asked by sharing.posts.Publish:recorded#2
where
  earlier, RequestBoundary.request (index, path: "/posts/publish", requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### sharing.posts.Retract

Authored path: `sharing.posts.Retract`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 11.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 14.

```reaction
when RequestBoundary.request (path: "/posts/retract", post, requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Retract#2

Authored path: `sharing.posts.Retract`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 11.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 14.

```reaction
when Sessioning.use (session, subject: author), asked by sharing.posts.Retract
where
  earlier, RequestBoundary.request (path: "/posts/retract", post, requestId, session)
then
  Posting.retract (author, post)
```

### sharing.posts.Retract#3

Authored path: `sharing.posts.Retract`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 11.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 14.

```reaction
when Posting.retract (author, post, result.post: retracted), asked by sharing.posts.Retract#2
where
  earlier, RequestBoundary.request (path: "/posts/retract", post, requestId, session)
then
  RequestBoundary.respond (post: retracted, requestId)
```

### sharing.posts.RetractForgetsLikes

Authored path: `sharing.posts.RetractForgetsLikes`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 17.

```reaction
when Posting.retract (post)
then
  Liking.forget (item: post)
```

### sharing.posts.Status

Authored path: `sharing.posts.Status`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 26.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 29.

```reaction
when RequestBoundary.request (index, path: "/posts/status", requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Status#2

Authored path: `sharing.posts.Status`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 26.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 29.

```reaction
when Sessioning.use (session, subject: author), asked by sharing.posts.Status
where
  earlier, RequestBoundary.request (index, path: "/posts/status", requestId, session)
  whether Posting._publishedAs (author, work: index) has (post)
then
  RequestBoundary.respond (post, requestId)
```

### sharing.posts.Timelapse

Authored path: `sharing.posts.Timelapse`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 38.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 41.

```reaction
when RequestBoundary.request (after, path: "/posts/timelapse", post, requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Timelapse:posted#2

Authored path: `sharing.posts.Timelapse`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 38.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 41.

```reaction
when Sessioning.use (session, subject: viewer), asked by sharing.posts.Timelapse
where
  earlier, RequestBoundary.request (after, path: "/posts/timelapse", post, requestId, session)
  Posting._get (post) has (author, createdAt, work)
  TimeLapsing._recording (after, index: work, owner: author) has (found, updates)
then
  RequestBoundary.respond (createdAt, found, requestId, updates)
```

### sharing.posts.Timelapse:unposted#2

Authored path: `sharing.posts.Timelapse`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 38.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 41.

```reaction
when Sessioning.use (session, subject: viewer), asked by sharing.posts.Timelapse
where
  earlier, RequestBoundary.request (after, path: "/posts/timelapse", post, requestId, session)
  no Posting._get (post)
then
  RequestBoundary.respond (createdAt: 0, found: false, requestId, updates: [])
```

### sharing.posts.Unlike

Authored path: `sharing.posts.Unlike`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 19.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 23.

```reaction
when RequestBoundary.request (path: "/posts/unlike", post, requestId, session)
then
  Sessioning.use (session)
```

### sharing.posts.Unlike#2

Authored path: `sharing.posts.Unlike`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 19.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 23.

```reaction
when Sessioning.use (session, subject: person), asked by sharing.posts.Unlike
where
  earlier, RequestBoundary.request (path: "/posts/unlike", post, requestId, session)
then
  Liking.unlike (item: post, person)
```

### sharing.posts.Unlike#3

Authored path: `sharing.posts.Unlike`.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 19.
- Covered by [Sharing timelapses](../design/compositions/sharing/posts.md), line 23.

```reaction
when Liking.unlike (item: post, person), asked by sharing.posts.Unlike#2
where
  earlier, RequestBoundary.request (path: "/posts/unlike", post, requestId, session)
then
  RequestBoundary.respond (requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/commons/choose` — requires `attempt`, `username`
- `/auth/commons/finish` — requires `attempt`, `code`, `state`
- `/auth/login` — requires `password`, `username`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/auth/register` — requires `password`, `username`
- `/canvas/history` — requires `after`, `session`
- `/canvas/picture` — requires `index`, `session`
- `/canvas/redo` — requires `key`, `sequence`, `session`, `timestamp`
- `/canvas/stroke` — requires `change`, `key`, `sequence`, `session`, `timestamp`
- `/canvas/submit` — requires `image`, `key`, `sequence`, `session`
- `/canvas/timelapse` — requires `after`, `index`, `session`
- `/canvas/timelapses` — requires `after`, `session`
- `/canvas/undo` — requires `key`, `sequence`, `session`, `timestamp`
- `/people/follow` — requires `session`, `username`
- `/people/following` — requires `session`
- `/people/search` — requires `prefix`, `session`
- `/people/suggestions` — requires `session`
- `/people/unfollow` — requires `session`, `username`
- `/posts/feed` — requires `before`, `session`
- `/posts/like` — requires `post`, `session`
- `/posts/picture` — requires `post`, `session`
- `/posts/publish` — requires `index`, `session`
- `/posts/retract` — requires `post`, `session`
- `/posts/status` — requires `index`, `session`
- `/posts/timelapse` — requires `after`, `post`, `session`
- `/posts/unlike` — requires `post`, `session`
- `/practice/begin` — requires `fundamental`, `session`
- `/practice/current` — requires `session`
- `/practice/discard` — requires `session`
- `/practice/start` — requires `session`
- `/references/access` — requires `session`
- `/references/add` — requires `credit`, `key`, `session`, `source`, `tags`
- `/references/appoint` — requires `session`, `username`
- `/references/catalog` — requires `session`
- `/references/remove` — requires `image`, `session`
- `/references/request` — requires `fundamental`, `session`
- `/references/tag` — requires `image`, `session`, `tags`
- `/streaks/current` — requires `session`
