# CoverageTracking

## Purpose

Show an artist how much they have practiced each fundamental, so the fundamentals they avoid become visible instead of quietly dropping out of their practice.

*Prevents:* counting one practice twice, mixing one artist's counts with another's, and hiding a fundamental that was never practiced at all.

## Principle

Maya finishes a drawing that exercises perspective and lighting, so each count becomes 1. She then finishes a lighting study, and lighting rises to 2. When she checks her coverage of perspective, lighting, and anatomy, anatomy appears first with 0, so she can see she has neglected it. A retried record of the lighting study does not count again. Ben's coverage stays separate from Maya's.

## Types

```types
external Artist
  The person whose practice is counted.
external Fundamental
  A drawing fundamental that a practice exercised, such as perspective or lighting.
opaque Set
  An unordered collection of distinct values of its type argument.
```

## State

```state
a set of Practices with
  an Artist
  a key String
  unique artist and key
a set of Exercises with
  a Practice
  a Fundamental
  unique practice and fundamental

Rule: Every practice has at least one exercise, and its exercises never change after it is recorded.
Rule: A fundamental's count for an artist is the number of that artist's practices with an exercise of that fundamental. Counts are derived, not stored.
```

## Actions

```actions
record(artist: Artist, key: String, fundamentals: Set<Fundamental>) : returns ()
  where fundamentals is empty
  then
    refuses NO_FUNDAMENTALS "A practice must exercise at least one fundamental."
  where artist already has a practice with key whose fundamentals differ from fundamentals
  then
    refuses PRACTICE_KEY_REUSED "This practice has already been recorded with different fundamentals."
  where artist already has a practice with key and the same fundamentals
  then
    leave the state unchanged
    returns
  where artist has no practice with key and fundamentals is not empty
  then
    add a new practice for artist with key, and one exercise of it for each fundamental in fundamentals
    returns
```

## Queries

```queries
_coverage(artist: Artist, fundamentals: Set<Fundamental>) : many (fundamental: Fundamental, count: Number)
  Returns one row for each given fundamental: the number of artist's practices that exercised it, or 0 when none did or the artist is unknown. Rows are ordered by ascending count, then by fundamental, so the least-practiced fundamentals come first.
```
