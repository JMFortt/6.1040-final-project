# Liking

## Purpose

Let people show appreciation for an item with one lightweight gesture, so its author sees that it resonated without anyone having to write a comment.

*Prevents:* one person liking the same item more than once, and likes outliving the item they were given to.

## Principle

Ben and Ana each like Maya's drawing, so its count is 2 and each of them sees that they liked it. Ben likes it again and is refused, so the count stays 2. Ana takes her like back, and the count drops to 1. When the drawing is withdrawn, its likes are forgotten.

## Types

```types
external Person
  Someone who can like an item.
external Item
  The thing that is liked.
```

## State

```state
a set of Likes with
  a Person
  an Item
  unique person and item
```

## Actions

```actions
like(person: Person, item: Item) : returns ()
  where person already likes item
  then
    refuses ALREADY_LIKED "You already like this."
  where person does not like item
  then
    add a like of item by person
    returns

unlike(person: Person, item: Item) : returns ()
  where person does not like item
  then
    refuses NOT_LIKED "You have not liked this."
  where person likes item
  then
    remove that like
    returns

forget(item: Item) : returns ()
  where true
  then
    remove every like of item, if any
    returns
```

## Queries

```queries
_count(item: Item) : one (count: Number)
  Returns how many people like item, or 0 when nobody does.

_likes(person: Person, item: Item) : one (liked: Flag)
  Returns whether person likes item. It is false for an unknown person or item.
```
