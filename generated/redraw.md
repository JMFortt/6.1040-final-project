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
- `complete(owner: Owner, key: String, sequence: Number) : returns (index: Number, sequence: Number)`
  - Refuses `INVALID_COMPLETION`: The completion is not valid.
  - Refuses `UPDATE_KEY_REUSED`: This update identifier has already been used.
  - Refuses `STALE_HISTORY`: Load the latest history before adding this update.
  - Refuses `EMPTY_HISTORY`: There are no updates to complete.

#### Queries

- `_history(owner: Owner, after: Number) : one (start: Number, updates: History)`
- `_recordings(owner: Owner, after: Number) : one (recordings: Recordings)`
- `_recording(owner: Owner, index: Number, after: Number) : one (found: Flag, updates: History)`

#### Instances

- `TimeLapsing` — instance of `TimeLapsing` — [Application types](../design/types.md), line 19.
  - `Owner` is `Registering.User` — [Application types](../design/types.md), line 20.

## Application types

Concrete types:

- `TimelapseNumber` — [Application types](../design/types.md), line 44.

## Computations

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
  TimeLapsing._history (after, owner) has (start, updates)
then
  RequestBoundary.respond (requestId, start, updates)
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
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 8.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 17.

```reaction
when RequestBoundary.request (key, path: "/canvas/submit", requestId, sequence, session)
then
  Sessioning.use (session)
```

### drawing.canvas.Submit#2

Authored path: `drawing.canvas.Submit`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 8.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 17.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Submit
where
  earlier, RequestBoundary.request (key, path: "/canvas/submit", requestId, sequence, session)
then
  TimeLapsing.complete (key, owner, sequence)
```

### drawing.canvas.Submit#3

Authored path: `drawing.canvas.Submit`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 8.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 17.

```reaction
when TimeLapsing.complete (key, owner, sequence, index, result.sequence: saved), asked by drawing.canvas.Submit#2
where
  earlier, RequestBoundary.request (key, path: "/canvas/submit", requestId, sequence, session)
then
  RequestBoundary.respond (index, requestId, sequence: saved)
```

### drawing.canvas.Timelapse

Authored path: `drawing.canvas.Timelapse`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 10.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 19.

```reaction
when RequestBoundary.request (after, index, path: "/canvas/timelapse", requestId, session)
then
  Sessioning.use (session)
```

### drawing.canvas.Timelapse#2

Authored path: `drawing.canvas.Timelapse`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 10.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 19.

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
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 9.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 19.

```reaction
when RequestBoundary.request (after, path: "/canvas/timelapses", requestId, session)
then
  Sessioning.use (session)
```

### drawing.canvas.Timelapses#2

Authored path: `drawing.canvas.Timelapses`.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 9.
- Covered by [Persistent canvas](../design/compositions/drawing/canvas.md), line 19.

```reaction
when Sessioning.use (session, subject: owner), asked by drawing.canvas.Timelapses
where
  earlier, RequestBoundary.request (after, path: "/canvas/timelapses", requestId, session)
  TimeLapsing._recordings (after, owner) has (recordings)
then
  RequestBoundary.respond (recordings, requestId)
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
- `/canvas/stroke` — requires `change`, `key`, `sequence`, `session`, `timestamp`
- `/canvas/submit` — requires `key`, `sequence`, `session`
- `/canvas/timelapse` — requires `after`, `index`, `session`
- `/canvas/timelapses` — requires `after`, `session`
- `/people/follow` — requires `session`, `username`
- `/people/following` — requires `session`
- `/people/search` — requires `prefix`, `session`
- `/people/suggestions` — requires `session`
- `/people/unfollow` — requires `session`, `username`
- `/posts/feed` — requires `before`, `session`
- `/posts/like` — requires `post`, `session`
- `/posts/publish` — requires `index`, `session`
- `/posts/retract` — requires `post`, `session`
- `/posts/status` — requires `index`, `session`
- `/posts/timelapse` — requires `after`, `post`, `session`
- `/posts/unlike` — requires `post`, `session`
- `/streaks/current` — requires `session`
