# Following artists

Artists follow each other so the work of people they care about reaches them first. Every endpoint resolves the follower with Sessioning.use. Requests name other artists by username, which Registering._byUsername turns into a user, so user ids never cross the HTTP boundary. Following stores only those identities.

[Following](reaction:sharing.people.Follow) and [unfollowing](reaction:sharing.people.Unfollow) answer `USER_NOT_FOUND` for an unknown username. Following refuses following oneself (`CANNOT_FOLLOW_SELF`), a duplicate follow (`ALREADY_FOLLOWING`), and unfollowing someone not followed (`NOT_FOLLOWING`).

```endpoints
sharing.people.Follow at /people/follow
sharing.people.Unfollow at /people/unfollow
```

The [following list](reaction:sharing.people.Followed) responds with [everyone the viewer follows](former:sharing.people.FollowingList), by username, most recently followed first. The feed's Following tab and its sidebar use it.

```endpoints
sharing.people.Followed at /people/following
```

[Suggestions](reaction:sharing.people.Suggestions) nudge an artist toward people to follow, most of all when they follow nobody yet. The [suggestion list](former:sharing.people.SuggestionList) starts from Posting._authors, the most recently active authors. It drops the viewer and anyone the viewer already follows, and shows each artist's post count and follower count. Suggestions come only from people who have shared work, so following one always puts something in the feed.

```endpoints
sharing.people.Suggestions at /people/suggestions
```

[Searching](reaction:sharing.people.Search) finds artists by the start of their username, ignoring letter case, through Registering._search. It responds with up to 10 [matching artists](former:sharing.people.SearchResults) in alphabetical order. The viewer is left out, and each match carries whether the viewer follows them and their follower count, so the result can be followed in place. Unlike suggestions, search also finds artists who have not shared anything yet. The prefix must be 1 to 32 username characters.

```endpoints
sharing.people.Search at /people/search
```
