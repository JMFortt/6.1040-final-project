# StreakTracking

## Purpose

Encourages users to practice consistently with a streak.

## Principle

When a user engages with the app for the first time in a 24 hour period, their streak count increases by one. The streak resets to zero if the user does not engage with the app in 24 hours. The user can see their streak within the user interface.

## Types

```types
external User
```

## State

```state
a set of Users with
  a streakCount Number
  a lastActiveDay Number
```

## Actions

```actions
engage(user: User) : returns ()
  where true
  then
    update the last active day of that user to the current day. If the new active day 1 is higher than the previous, also increase their streak count by 1
    returns

expire(user: User) : returns ()
  where the last active day of the user is more than one day behind the current day
  then
    reset the streak count of that user to zero
    returns
```

## Queries

```queries
_getStreak(user: User) : one (streakCount: Number)
  Requires user to be in Users.
  Returns the user's streakCount.
```
