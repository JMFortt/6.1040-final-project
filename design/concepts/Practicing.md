# Practicing

## Purpose

Remember the one practice an artist is in the middle of — the fundamental, the reference, and when the drawing time started — so leaving and coming back continues that same attempt.

*Prevents:* a later visit handing out a different reference, the clock starting over after the artist has already drawn, and two practices being open at once.

## Principle

Maya chooses lighting and is given the lamp. She leaves and comes back to the same lamp, and the clock has not started. She draws, and the clock starts. She closes the app and returns; the clock is still running from that first stroke. She finishes, and the next visit has no practice until she chooses again.

## Types

```types
external Artist
external Fundamental
  A drawing fundamental, such as perspective or lighting.
```

## State

```state
a set of Attempts with
  an Artist
  a Fundamental
  an image String
  a source String
  a credit String
  an optional startedAt Number
  unique artist

Rule: An artist has at most one attempt. startedAt is absent until drawing time starts. Starting again keeps the original time.
Rule: A fundamental is 1 to 40 characters after trimming. An image id is 1 to 80 characters. A source is 1 to 2048 characters after trimming. A credit is 1 to 300 characters after trimming.
```

## Actions

```actions
begin(artist: Artist, fundamental: Fundamental, image: String, source: String, credit: String) : returns (fundamental: Fundamental, image: String, source: String, credit: String, started: Flag, startedAt: Number)
  where fundamental, image, source, or credit is not well formed
  then
    refuses INVALID_ATTEMPT "A practice needs one fundamental and a reference."
  where artist already has an attempt
  then
    returns fundamental, image, source, credit, started, startedAt
  where artist has no attempt
  then
    record the attempt with no start time
    returns fundamental, image, source, credit, started, startedAt

start(artist: Artist, instant: DateTime) : returns (startedAt: Number)
  where instant is not a time
  then
    refuses INVALID_ATTEMPT "A practice needs one fundamental and a reference."
  where artist has no attempt
  then
    refuses NOT_PRACTICING "There is no practice to time."
  where the attempt already has a start time
  then
    returns startedAt
  where the attempt has no start time
  then
    record instant as the start time
    returns startedAt

end(artist: Artist) : returns ()
  where artist has an attempt
  then
    remove the attempt
    returns
  where artist has no attempt
  then
    returns
```

## Queries

```queries
_current(artist: Artist) : one (practicing: Flag, fundamental: Fundamental, image: String, source: String, credit: String, started: Flag, startedAt: Number)
  Returns the artist's attempt. practicing is false, the strings are empty, started is false, and startedAt is 0 when the artist has no attempt. startedAt is 0 until drawing time starts.
```
