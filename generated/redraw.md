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

### Registering

Defined in [Registering](../design/concepts/Registering.md), line 1.

#### Actions

- `register(username: String) : returns (user: User)`
  - Refuses `INVALID_USERNAME`: A username must have 3 to 32 letters, digits, underscores, or hyphens.
  - Refuses `USERNAME_TAKEN`: That username is taken.

#### Queries

- `_byUsername(username: String) : optional (user: User)`
- `_username(user: User) : optional (username: String)`

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
