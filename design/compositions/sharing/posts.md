# Sharing timelapses

Artists share completed timelapses with everyone else who is signed in. Each endpoint resolves the acting user with Sessioning.use, so a request never names an author or an owner. Posting is bound to TimeLapsing's numbering: a post's author and work name exactly one of that author's completed recordings. Recordings are immutable, so a post never goes stale.

[Publishing](reaction:sharing.posts.Publish) checks TimeLapsing._recording for the signed-in artist first. Only an existing completed timelapse is passed to Posting.publish. A missing one is answered with `TIMELAPSE_NOT_FOUND`, and sharing the same timelapse twice is refused by Posting with `ALREADY_PUBLISHED`. An artist cannot publish another artist's work, because the author is always the session's user.

```endpoints
sharing.posts.Publish at /posts/publish
```

[Retracting](reaction:sharing.posts.Retract) passes the session's user as the author. Posting itself refuses a retraction by anyone else with `POST_NOT_FOUND`, so the rule also holds for direct calls. Retracting removes the post from the feed and makes the timelapse private again. The recording itself is unchanged.

```endpoints
sharing.posts.Retract at /posts/retract
```

When a post is retracted, [its likes are forgotten](reaction:sharing.posts.RetractForgetsLikes) through Liking.forget, so likes never outlive the post. Publishing the timelapse again creates a new post that starts with no likes.

[Liking](reaction:sharing.posts.Like) a post requires the post to exist. Liking accepts any item, so that check is this application's rule, answered with `POST_NOT_FOUND`. [Unliking](reaction:sharing.posts.Unlike) passes the session's user to Liking.unlike. Liking refuses a second like (`ALREADY_LIKED`) and unliking a post that was never liked (`NOT_LIKED`).

```endpoints
sharing.posts.Like at /posts/like
sharing.posts.Unlike at /posts/unlike
```

[Status](reaction:sharing.posts.Status) reads Posting._publishedAs for one of the signed-in artist's own timelapses. The private gallery uses it to show Share or Unshare. A timelapse that is not shared answers with a null post.

```endpoints
sharing.posts.Status at /posts/status
```

The [feed](reaction:sharing.posts.Feed) is available only to signed-in users, which limits bulk copying of artists' work. It responds with one [feed page](former:sharing.posts.FeedPage) of up to 20 posts in Posting._feed's newest-first order. Each row carries the post, its timelapse number, its publication time, and the author's username from Registering._username. It also carries the like count from Liking._count, whether the viewer likes it from Liking._likes, and whether the viewer follows its author from Following._isFollowing. The page builds its Following tab by keeping the rows whose author the viewer follows and loading further pages until it has enough. A missing username leaves the row in place with a null username. The cursor is the last post shown, and an empty cursor starts at the newest post.

```endpoints
sharing.posts.Feed at /posts/feed
```

[Viewing a posted timelapse](reaction:sharing.posts.Timelapse) reads Posting._get, then reads the author's recording through TimeLapsing._recording, one page of 50 strokes at a time. A viewer reaches strokes only through a post that exists. An unknown or retracted post answers `found: false` with no strokes, so retracting makes the replay private again right away. The replay shows the process, not only the result, in line with the ethical analysis.

```endpoints
sharing.posts.Timelapse at /posts/timelapse
```

Deferred, and recorded in `agents/working-notes.md`: comments, reporting a post and turning posting off once nobody moderates, attaching posts to a reference image's board, and filtering by fundamental. Following is in the [people composition](people.md).
