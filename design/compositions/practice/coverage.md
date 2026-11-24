# Fundamentals coverage

The team chose to count the fundamental an artist chose for a practice, not every tag on its reference photo, and to report a fixed list of fundamentals. A practice is recorded when its artwork is saved; the [drawing session](practicing.md) explains how.

```computations
coverageFundamentals() : Set<FundamentalName>
  Returns the fundamentals coverage reports on: anatomy, color, form, lighting, and perspective. These are the same five the Draw picker and the References page offer.
```

The [current coverage endpoint](reaction:practice.coverage.Current) resolves the signed-in artist with Sessioning.use and reads the list from [coverageFundamentals](computation:coverageFundamentals). It responds with [one row per fundamental](former:practice.coverage.CoverageRows) from CoverageTracking._coverage: the number of the artist's saved practices of that fundamental, or 0 when there are none. Rows are ordered least practiced first, then by name, so the page can suggest what to practice next. The request cannot choose an artist or the list.

```endpoints
practice.coverage.Current at /coverage/current
```
