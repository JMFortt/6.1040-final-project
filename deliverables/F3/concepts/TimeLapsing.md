# TimeLapsing

## Purpose

Records the artist’s strokes for time-lapses; provide a step-by-step replay of what happened in the drawing

## Principle

When a user draws an image, the strokes and deletions are recorded, and at the end a video is generated containing every update to the canvas in order.

## Types

```types
external Change
external Timestamp
external Video
```

## State

```state
a set of Updates with
  a change Change
  a timestamp Timestamp
```

## Actions

```actions
addUpdate(change: Change, timestamp: Timestamp) : returns ()
  where true
  then
    adds a new Update with the given change and timestamp
    returns
```

## Queries

```queries
_render() : one (timelapse: Video)
  Returns a short video containing each Update’s change in order on the canvas.
```
