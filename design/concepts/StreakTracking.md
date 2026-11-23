# StreakTracking

## Purpose

Encourages users to interact consistently with a streak.

## Principle

When a user engages for the first time in a period, their streak count increases by one. The streak resets to zero if a whole period passes without the user engaging. The user can see their streak.

## Types

```types
external User
```

## State

```state
a set of Users with
  a streakCount Number
  a lastActivePeriod Number

Rule: periods are whole numbers of at least 0 chosen by the caller, and period n + 1 immediately follows period n.
```

## Actions

```actions
engage(user: User, period: Number) : returns (streakCount: Number)
  where period is not a whole number of at least 0
  then
    refuses INVALID_PERIOD "The period is not valid."
  where user's lastActivePeriod is later than period
  then
    refuses STALE_PERIOD "This period has already passed."
  where user's lastActivePeriod is period
  then
    leave the user unchanged
    returns streakCount
  where user's lastActivePeriod is period − 1
  then
    set the user's lastActivePeriod to period and increase their streakCount by 1
    returns streakCount
  where user is not in Users, or their lastActivePeriod is earlier than period − 1
  then
    set the user's lastActivePeriod to period and their streakCount to 1
    returns streakCount

expire(user: User, period: Number) : returns (streakCount: Number)
  where period is not a whole number of at least 0
  then
    refuses INVALID_PERIOD "The period is not valid."
  where user's lastActivePeriod is earlier than period − 1
  then
    reset the streak count of that user to zero
    returns streakCount
  where user is not in Users, or their lastActivePeriod is period − 1 or later
  then
    leave the state unchanged
    returns streakCount
```

## Queries

```queries
_getStreak(user: User) : one (streakCount: Number)
  Returns the user's streakCount, or 0 when user is not in Users.
```
