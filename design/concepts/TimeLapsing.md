# TimeLapsing

## Purpose

Record changes over time so a process can be replayed step by step.

*Prevents:* losing changes or their order, mixing owners' histories, and recording the same change twice.

## Principle

Maya's changes are recorded as she works. She undoes her latest change and redoes it. She completes her first recording and starts a new one. Later, she replays the first recording's changes in order, including removals. Ben's recordings remain separate from hers.

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
  an image String
  unique owner and index

Rule: Updates, undos, redos, and completions share an immutable sequence and unique keys per owner. Each completion preserves the drawing since the previous completion and the picture of that recording; later events form the current history. Recordings are numbered consecutively from 1.
Rule: Replaying the events after a completion yields the drawing. A change adds its stroke and discards any redo. Undo lifts the latest stroke onto the redo stack. Redo puts that stroke back. The working canvas and a completed recording contain only the strokes still on the drawing. The tip is the latest event sequence and may be ahead of the last visible stroke.
Rule: Repeating an accepted action with the same key and content returns its original result without changing state.
Rule: Abandoning removes every event after the latest completion. Completed recordings stay. Abandoning an empty current history changes nothing.
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

complete(owner: Owner, key: String, sequence: Number, image: String) : returns (index: Number, sequence: Number)
  where the completion is malformed
  then
    refuses INVALID_COMPLETION "The completion is not valid."
  where key identifies an update or a different completion for owner
  then
    refuses UPDATE_KEY_REUSED "This update identifier has already been used."
  where key is new and sequence is not next in owner's history
  then
    refuses STALE_HISTORY "Load the latest history before adding this update."
  where key is new, sequence is next, and the drawing has no stroke
  then
    refuses EMPTY_HISTORY "There are no updates to complete."
  where the completion is accepted
  then
    preserve the current drawing and its picture under the next index with the completion time and begin an empty history, or retrieve the original result on retry
    returns index, sequence

undo(owner: Owner, key: String, sequence: Number, timestamp: Number) : returns (sequence: Number, removed: String)
  where the undo is malformed
  then
    refuses INVALID_UPDATE "The update is not valid."
  where key identifies a different event for owner
  then
    refuses UPDATE_KEY_REUSED "This update identifier has already been used."
  where key is new and sequence is not next in owner's history
  then
    refuses STALE_HISTORY "Load the latest history before adding this update."
  where key is new, sequence is next, and the drawing has no stroke
  then
    refuses NOTHING_TO_UNDO "There is no stroke to undo."
  where the undo is accepted
  then
    record the undo, or retrieve the original result on retry
    returns sequence, removed

redo(owner: Owner, key: String, sequence: Number, timestamp: Number) : returns (sequence: Number, key: String, change: String, timestamp: Number)
  where the redo is malformed
  then
    refuses INVALID_UPDATE "The update is not valid."
  where key identifies a different event for owner
  then
    refuses UPDATE_KEY_REUSED "This update identifier has already been used."
  where key is new and sequence is not next in owner's history
  then
    refuses STALE_HISTORY "Load the latest history before adding this update."
  where key is new, sequence is next, and there is no stroke to restore
  then
    refuses NOTHING_TO_REDO "There is no stroke to redo."
  where the redo is accepted
  then
    record the redo, or retrieve the original result on retry
    returns sequence, key, change, timestamp

abandon(owner: Owner) : returns ()
  where owner has events after the latest completion
  then
    remove those events
    returns
  where owner has no events after the latest completion
  then
    returns
```

## Queries

```queries
_history(owner: Owner, after: Number) : one (start: Number, tip: Number, updates: History, redo: Number)
  Returns the current history's starting boundary, the tip, the next page of strokes still on the drawing after the given sequence, in order, and how many strokes can be redone.

_picture(owner: Owner, index: Number) : one (found: Flag, image: String)
  Returns the picture preserved with that recording. found is false and image is empty when the recording does not exist, its index is invalid, or it was completed without a picture.

_recordings(owner: Owner, after: Number) : one (recordings: Recordings)
  Returns the next page of owner's completed recordings after the given index, in order, with update counts and completion times.

_recording(owner: Owner, index: Number, after: Number) : one (found: Flag, updates: History)
  Returns the next page of the strokes that were on the drawing when it was completed, after the given sequence, in order; found is false with no updates if the recording does not exist or its index is invalid.
```
