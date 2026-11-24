# Drawing session

An artist practices one fundamental at a time. [Current](reaction:practice.practicing.Current) returns the signed-in artist's open attempt, or an empty one when they have not chosen. [Begin](reaction:practice.practicing.Begin) resolves that artist, reads the current Eastern Time day with `now` and [easternDay](computation:easternDay), and asks ReferencePhotoBinning for that fundamental's photo. It records the attempt with Practicing. The request cannot choose the photo or the day. A fundamental with no photo is refused. Beginning again while an attempt is open returns that attempt.

The clock does not start until the artist draws. [Start](reaction:practice.practicing.Start) records the flow's current instant on the attempt. A second start keeps the first instant. The page treats that instant as the beginning of 15 minutes. Leaving the page or closing the app does not move the instant.

[Discard](reaction:practice.practicing.Discard) removes the unfinished drawing with TimeLapsing.abandon and ends the attempt. Completed recordings stay. [A submission ends the attempt](reaction:practice.practicing.SubmitEndsPractice) when TimeLapsing.complete returns, after the streak reaction has counted it, so the next visit starts from the fundamental list. Save artwork keeps the drawing as a completed recording. Discard does not.

The page shows Save artwork and Discard for the whole attempt. When 15 minutes have passed since the first stroke, the page stops new strokes and disables the tool bar. Panning and moving to other pages stay available. The concept does not know the length of the attempt; the page does.

```endpoints
practice.practicing.Current at /practice/current
practice.practicing.Begin at /practice/begin
practice.practicing.Start at /practice/start
practice.practicing.Discard at /practice/discard
```
