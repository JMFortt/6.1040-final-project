# TimeLapsing

## Purpose

Record changes over time so a process can be replayed step by step.

*Prevents:* losing changes or their order, mixing owners' histories, and recording the same change twice.

## Principle

Maya's changes are recorded as she works. She completes her first recording and starts a new one. Later, she replays the first recording's changes in order, including removals. Ben's recordings remain separate from hers.

## Types

```types
external Owner
opaque History
opaque Recordings
```

## State

```state
a set of Updates with
  an Owner
  a key String
  a sequence Number
  a change String
  a timestamp Number
a set of Completions with
  an Owner
  a key String
  a sequence Number
  an index Number
  a createdAt Number
  unique owner and index

Rule: Updates and completions share an immutable sequence and unique keys per owner. Each completion preserves the updates since the previous completion; later updates form the current history. Recordings are numbered consecutively from 1.
Rule: Repeating an accepted action with the same key and content returns its original result without changing state.
```

## Actions

```actions
addUpdate(owner: Owner, key: String, sequence: Number, change: String, timestamp: Number) : returns (sequence: Number)
  where the update is malformed
  then
    refuses INVALID_UPDATE "The update is not valid."
  where key identifies a different update or a completion for owner
  then
    refuses UPDATE_KEY_REUSED "This update identifier has already been used."
  where key is new and sequence is not next in owner's history
  then
    refuses STALE_HISTORY "Load the latest history before adding this update."
  where the update is accepted
  then
    record the change and its occurrence time, or retrieve the original result on retry
    returns sequence

complete(owner: Owner, key: String, sequence: Number) : returns (index: Number, sequence: Number)
  where the completion is malformed
  then
    refuses INVALID_COMPLETION "The completion is not valid."
  where key identifies an update or a different completion for owner
  then
    refuses UPDATE_KEY_REUSED "This update identifier has already been used."
  where key is new and sequence is not next in owner's history
  then
    refuses STALE_HISTORY "Load the latest history before adding this update."
  where key is new, sequence is next, and the current history is empty
  then
    refuses EMPTY_HISTORY "There are no updates to complete."
  where the completion is accepted
  then
    preserve the current history under the next index with the completion time and begin an empty history, or retrieve the original result on retry
    returns index, sequence
```

## Queries

```queries
_history(owner: Owner, after: Number) : one (start: Number, updates: History)
  Returns the current history's starting boundary and the next page of its updates after the given sequence, in order.

_recordings(owner: Owner, after: Number) : one (recordings: Recordings)
  Returns the next page of owner's completed recordings after the given index, in order, with update counts and completion times.

_recording(owner: Owner, index: Number, after: Number) : one (found: Flag, updates: History)
  Returns the next page of the recording's updates after the given sequence, in order; found is false with no updates if the recording does not exist or its index is invalid.
```
