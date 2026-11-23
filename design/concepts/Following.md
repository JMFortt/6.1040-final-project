# Following

## Purpose

Let a person choose whose work they want to keep up with, so that work can be put in front of them instead of being lost among everyone else's.

*Prevents:* following someone twice, following oneself, and losing track of whom one follows.

## Principle

Maya follows Ben and Ana, so both appear in the list of people Maya follows, and Ben counts Maya among his followers. Maya cannot follow Ben a second time or follow herself. When Maya unfollows Ana, Ana leaves her list, and Ben's stays.

## Types

```types
external Person
  Someone who can follow and be followed.
```

## State

```state
a set of Follows with
  a follower Person
  a followee Person
  a since Number
  unique follower and followee

Rule: No follow has the same person as follower and followee.
```

## Actions

```actions
follow(follower: Person, followee: Person) : returns ()
  where follower is followee
  then
    refuses CANNOT_FOLLOW_SELF "You cannot follow yourself."
  where follower already follows followee
  then
    refuses ALREADY_FOLLOWING "You already follow this person."
  where follower is not followee and does not follow followee
  then
    add a follow of followee by follower with the current time
    returns

unfollow(follower: Person, followee: Person) : returns ()
  where follower does not follow followee
  then
    refuses NOT_FOLLOWING "You do not follow this person."
  where follower follows followee
  then
    remove that follow
    returns
```

## Queries

```queries
_following(follower: Person) : many (followee: Person, since: Number)
  Returns everyone follower follows, most recently followed first, or no rows when follower follows nobody.

_isFollowing(follower: Person, followee: Person) : one (following: Flag)
  Returns whether follower follows followee. It is false for an unknown person and for a person paired with themselves.

_followerCount(followee: Person) : one (count: Number)
  Returns how many people follow followee, or 0 when nobody does.
```
