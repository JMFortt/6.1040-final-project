# Reference bank

```computations
easternDay(instant: DateTime) : Number
  Returns the Eastern Time calendar day of instant. Day 0 is 1970-01-01, and day n + 1 is the next local date. The date follows daylight saving time.
```

The bank is one shared set of tagged photos. A practice request names one fundamental. The composition reads the flow's current instant with `now` and converts it to an Eastern Time calendar day with [easternDay](computation:easternDay). The request cannot choose the day. ReferencePhotoBinning assigns one photo to that fundamental for the day. Every signed-in artist who asks for it receives that photo.

A signed-in user becomes the first curator by [appointing themself](reaction:practice.references.Appoint). A curator appoints another registered user by username. The request names a username, and Registering._byUsername supplies the user. An unknown username is `USER_NOT_FOUND`. Appointing someone who is already a curator is `ALREADY_CURATOR`. The first signed-in user can appoint only themself; appointing someone else first is `FIRST_CURATOR`. Anyone else who tries to appoint, add, remove, or tag is `NOT_CURATOR`.

```endpoints
practice.references.Appoint at /references/appoint
```

[Adding](reaction:practice.references.Add) stores one photo. The source is the text the caller supplies, such as a URL, and the credit names its author. The key makes a retry of the same photo return the original image instead of inserting a second copy. A different photo under that key is `IMAGE_KEY_REUSED`. The same source under a new key is `SOURCE_REUSED`. A missing key, source, credit, or a tag list that is not one to eight tags is `INVALID_IMAGE`.

```endpoints
practice.references.Add at /references/add
```

[Removing](reaction:practice.references.Remove) drops a photo and its tags. An unknown id is `IMAGE_NOT_FOUND`. [Tagging](reaction:practice.references.Tag) replaces that photo's tags with the given set. The same set again leaves the photo as it was.

```endpoints
practice.references.Remove at /references/remove
practice.references.Tag at /references/tag
```

[Access](reaction:practice.references.Access) tells a signed-in user whether they are a curator and whether the bank still has no curator. The reference page is shown only to a curator, or to anyone while no curator exists, so the first one can appoint themself.

[Catalog](reaction:practice.references.Catalog) is open to a curator. It reads the whole bank and does not assign a photo for the day. Anyone else receives `NOT_CURATOR`.

When the server starts, it calls `provide` for each curated photo this database has not already been introduced to. `provide` is not an endpoint. A photo a curator later edits or removes stays as the curator left it. The curated files are served from the site, and each credit is the author and license named on its Wikimedia Commons page.

[Requesting](reaction:practice.references.Request) is open to every signed-in user, and the user is not an argument, so two artists cannot receive different photos. The body names one fundamental. The response is that day's photo, or `found: false` when none is tagged with it. A photo already assigned to another fundamental today is skipped, unless it is the only one tagged with the requested fundamental. Among the photos that remain, the one used least recently is chosen, and a tie is broken at random. The same choice is stored for the rest of the day.

```endpoints
practice.references.Access at /references/access
practice.references.Catalog at /references/catalog
practice.references.Request at /references/request
```

A saved drawing counts toward coverage of the fundamental the artist chose, not every tag on the photo. The [drawing session](practicing.md) records it from the open practice, and [coverage](coverage.md) reports it.
