# Weekly streaks

The team chose a weekly streak. A week runs Monday 00:00 to Sunday 24:00 in America/New_York. StreakTracking only counts numbered periods, so this composition reads the flow's current instant with `now` and converts it to a week number with [easternWeek](computation:easternWeek). Weeks follow the Eastern calendar date, so they stay aligned across daylight saving changes. Week 0 began on Monday 1970-01-05.

```computations
easternWeek(instant: DateTime) : Number
  Returns the number of the Monday-to-Sunday week in America/New_York that contains instant. Week 0 began on Monday 1970-01-05 at midnight Eastern Time, and week n + 1 immediately follows week n.
```

Submitting a drawing is the interaction a streak counts. When TimeLapsing.complete returns for an owner, [the submission engages the streak](reaction:practice.streaks.SubmitEngagesStreak) for that owner in the current week. Several submissions in one week count once. A retried submission returns its original result, and engaging again in the same week changes nothing.

Nothing in the sync engine runs on a timer, so the [current streak endpoint](reaction:practice.streaks.Current) resolves the signed-in user with Sessioning.use, calls StreakTracking.expire for the current week, and responds with the resulting streak count. A streak whose last active week ended before last week reads as 0. A user who has never submitted also reads as 0. The request cannot choose a user or a week.

```endpoints
practice.streaks.Current at /streaks/current
```
