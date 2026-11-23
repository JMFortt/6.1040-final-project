# ReferencePhotoBinning

## Purpose

Give every artist the same small bank of reference photos, each tagged by the fundamentals it exercises, so someone can ask for a fundamental and draw from the photos the whole group is using.

*Prevents:* each artist hunting for a different photo, a photo sitting in the bank with no fundamental, and one artist receiving a different bank than another.

## Principle

Ada appoints herself curator and adds a street tagged perspective and a harbor tagged perspective. Maya requests perspective and receives one of them. Ben requests perspective that same day and receives the same photo. The next day, perspective is the other photo, because the first was used more recently. Ada also adds a lamp tagged only lighting and a plaza tagged color and lighting. Color is assigned the plaza. Lighting that day is the lamp, because the plaza was already assigned. On a later day when the lamp is gone, lighting uses the plaza, because no other lighting photo remains.

## Types

```types
external Admin
  A person who may be appointed to curate the bank.
external Fundamental
  A drawing fundamental a photo exercises, such as perspective or lighting.
opaque Set
  An unordered collection of distinct values of its type argument.
```

## State

```state
a set of Curators with
  an Admin
  unique admin
a set of Images with
  an id String
  a key String
  a source String
  a credit String
  an optional lastUsed Number
  unique id
  unique key
  unique source
a set of Tags with
  an image String
  a Fundamental
  unique image and fundamental
a set of Assignments with
  a day Number
  a Fundamental
  an image String
  unique day and fundamental

Rule: A request names one fundamental and one day. It does not depend on who asks. The day is supplied by the caller.
Rule: lastUsed is the last day an image was assigned to any fundamental. An image with no lastUsed has never been assigned. Assignment prefers the smallest lastUsed, and breaks ties at random.
Rule: An image already assigned to a fundamental on a day is not assigned to a second fundamental that day, unless every photo tagged with the second fundamental is already assigned that day.
Rule: Fundamentals that do not yet have a photo for the day are assigned in alphabetical order. An assignment stays until its photo is removed or no longer carries that fundamental.
Rule: A key is 1 to 80 characters. A source is 1 to 2048 characters after trimming. A credit is 1 to 300 characters after trimming. A tag is 1 to 40 characters after trimming. An image is listed with at most 8 tags and has 1 to 8 distinct tags. The same tag on one image is stored once.
Rule: The first curator appoints themself. Later curators are appointed by someone who is already a curator.
```

## Actions

```actions
appoint(admin: Admin, curator: Admin) : returns ()
  where no curator exists and admin is not curator
  then
    refuses FIRST_CURATOR "The first curator must appoint themself."
  where no curator exists and admin is curator
  then
    record admin as a curator
    returns
  where some curator exists and admin is not a curator
  then
    refuses NOT_CURATOR "Only a curator can change the reference bank."
  where admin is a curator and curator is already a curator
  then
    refuses ALREADY_CURATOR "This person is already a curator."
  where admin is a curator and curator is not a curator
  then
    record curator as a curator
    returns

add(admin: Admin, key: String, source: String, credit: String, tags: Set<Fundamental>) : returns (image: String)
  where admin is not a curator
  then
    refuses NOT_CURATOR "Only a curator can change the reference bank."
  where key, source, credit, or tags is not well formed
  then
    refuses INVALID_IMAGE "The image needs a key, a source, a credit, and one to eight tags."
  where key identifies an image with a different source, credit, or tags
  then
    refuses IMAGE_KEY_REUSED "This image identifier has already been used."
  where key identifies an image with the same source, credit, and tags
  then
    leave the state unchanged
    returns image
  where source identifies a different image
  then
    refuses SOURCE_REUSED "This reference is already in the bank."
  where the image is new
  then
    add it with a new id and the given tags
    returns image

remove(admin: Admin, image: String) : returns ()
  where admin is not a curator
  then
    refuses NOT_CURATOR "Only a curator can change the reference bank."
  where no image has id image
  then
    refuses IMAGE_NOT_FOUND "That reference is not in the bank."
  where an image has id image
  then
    remove that image, its tags, and any assignment of it
    returns

tag(admin: Admin, image: String, tags: Set<Fundamental>) : returns ()
  where admin is not a curator
  then
    refuses NOT_CURATOR "Only a curator can change the reference bank."
  where tags is not well formed
  then
    refuses INVALID_IMAGE "A reference needs one to eight tags."
  where no image has id image
  then
    refuses IMAGE_NOT_FOUND "That reference is not in the bank."
  where an image has id image and tags is well formed
  then
    replace that image's tags with tags
    returns

request(day: Number, fundamental: Fundamental) : returns (found: Flag, image: String, source: String, credit: String)
  where day is not a whole number of 0 or more, or fundamental is not a well-formed tag, or no photo carries fundamental
  then
    found is false and image, source, and credit are empty
    returns found, image, source, credit
  where this day already assigned a photo to fundamental and that photo still carries fundamental
  then
    returns found, image, source, credit
  where this day has no such photo
  then
    assign a photo for every fundamental that has one and does not already have an assignment
    found is false when fundamental still has no photo
    returns found, image, source, credit
```

## Queries

```queries
```
