# CoverageTracking

## Purpose

Keep track of which fundamentals an artist has practiced and which fundamentals are neglected; Allow artists to find and practice the skills they haven’t worked on as much

## Principle

When a user draws an image, the fundamentals that were practiced are logged. The user can then view how many images they’ve drawn for each fundamental.

## Types

```types
external FundamentalTag
external ReferenceImage
```

## State

```state
a set of Fundamentals with
  a tag FundamentalTag
  a count Number
  Rule: count is an integer
```

## Actions

```actions
addImage(image: ReferenceImage) : returns ()
  where true
  then
    add one to the count of every stored Fundamental with a tag matching any one of image’s FundamentalTags
    returns
```

## Queries

```queries
_getCoverage(tag: FundamentalTag) : one (count: Number)
  Requires tag to be a tag of some Fundamental.
  Returns the count of the Fundamental with a tag equal to tag.
```
