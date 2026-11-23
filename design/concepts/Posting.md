# Posting

## Purpose

Let an author share a finished piece of work with others, credited to them, for as long as they choose to keep it up.

*Prevents:* a piece appearing without its author choosing to share it, the same piece being listed twice, and a piece staying visible after its author takes it down.

## Principle

Maya publishes her first piece. Everyone browsing the feed sees it, credited to Maya. Ben publishes a piece afterward, and his appears above hers because the feed shows the newest first. When Maya tries to publish the same piece again, she is refused. Ben cannot retract Maya's post. Later, Maya retracts it, and it no longer appears in the feed.

## Types

```types
external Author
  The identity credited with a post.
external Work
  The shared piece. Together with its author, it identifies what was shared.
```

## State

```state
a set of Posts with
  an Author
  a Work
  a createdAt Number
  unique author and work

Rule: Posts are ordered by publication. A later post always sorts before an earlier one in the feed.
```

## Actions

```actions
publish(author: Author, work: Work) : returns (post: Post)
  where author already has a post of work
  then
    refuses ALREADY_PUBLISHED "You have already shared this piece."
  where author has no post of work
  then
    add a new post of work by author with the publication time
    returns post

retract(author: Author, post: Post) : returns (post: Post)
  where post is not in Posts or its author is not author
  then
    refuses POST_NOT_FOUND "There is no such post."
  where post is in Posts and its author is author
  then
    remove post
    returns post
```

## Queries

```queries
_feed(before: String) : many (post: Post, author: Author, work: Work, createdAt: Number)
  Returns up to 20 posts, newest first. An empty before starts at the newest post. Otherwise the page holds the posts published before the post named by before, and an unknown before returns no rows.

_get(post: Post) : optional (author: Author, work: Work, createdAt: Number)
  Returns the post's author, work, and publication time, or no row for an unknown post.

_publishedAs(author: Author, work: Work) : optional (post: Post)
  Returns author's post of work, or no row when author has not shared it.

_authors() : many (author: Author, posts: Number, latest: Number)
  Returns up to 20 authors who have at least one post, each with their number of posts and latest publication time, most recently active first. Returns no rows when there are no posts.
```
