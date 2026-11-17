# ReferencePhotoBinning

## Purpose

Give all users that are active in the same time frame (e.g. a day) the same set of reference photos to practice with; Split reference images into fundamental categories

## Principle

A developer first populates the reference bank with a set of images all tagged by the fundamentals that are best expressed by that image (using the discretion of the developer). A user can then request a reference image based on a fundamental of their choosing. There is a limited amount of references for each skill in a given time period and all users share the same bank of images in that time period.

## Types

```types
external FundamentalTag
opaque Set
  An unordered collection of distinct values of its type argument.
```

## State

```state
a set of ReferenceImages with
  an id String
  a set of FundamentalTags
```

## Actions

```actions
submitPhoto(image: ReferenceImage, tags: Set<FundamentalTag>) : returns ()
  where the submitter is an admin/developer and tags is non-empty
  then
    add the image to the set of all images with a randomly generated id and the given tags
    returns
```

## Queries

```queries
_requestPhoto(tags: Set<FundamentalTag>) : many (image: ReferenceImage)
  Returns all reference images that match all given tags, limited to the bank of the day (managed by the server).
```
