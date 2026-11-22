# Persistent canvas

The team selected one persistent private canvas per artist. The [history endpoint](reaction:drawing.canvas.History) uses Sessioning.use to resolve the owner, then reads TimeLapsing._history. The [stroke endpoint](reaction:drawing.canvas.Stroke) resolves the owner the same way, then records a validated change with TimeLapsing.addUpdate. Request bodies cannot choose an owner. Empty histories represent blank canvases; no separate creation lifecycle is needed.

```endpoints
drawing.canvas.History at /canvas/history
drawing.canvas.Stroke at /canvas/stroke
drawing.canvas.Submit at /canvas/submit
drawing.canvas.Timelapses at /canvas/timelapses
drawing.canvas.Timelapse at /canvas/timelapse
```

Stroke values use renderer version `easy-brush-0.5.0-v1`, a fixed 1200 × 900 coordinate space, an ink, dry-brush, graphite, or eraser preset, hex color, size, opacity, and ordered points (x, y, pressure, elapsed milliseconds). The boundary validates every field, finite ranges, and monotonically increasing point times. A stroke contains at most 4096 points and is at most 524288 characters; long gestures continue in a new stroke. The record's timestamp captures the gesture's start time. Eraser updates remain in the history and replay with destination-out compositing. Textures are deterministic, versioned brush tips with no random jitter.

The browser queues completed strokes, sends them sequentially, and retains pending strokes for retry. UUID keys make retry after a lost response safe. A stale sequence triggers retrieval of new updates before retrying. An INVALID_REQUEST refusal stops retries and drawing while retaining the rejected stroke. The artist may explicitly discard that stroke; the browser then reconstructs the remaining drawing and resumes saving. No rejected stroke is silently discarded. History is paginated, so reload does not request the entire history in one response. The canvas blocks drawing until restoration completes and exposes save failures. In-app navigation waits for drawing and saving to finish. Leaving with unsaved strokes prompts the browser's normal unsaved-work warning.

[Submit](reaction:drawing.canvas.Submit) resolves the owner through Sessioning.use and calls TimeLapsing.complete with a UUID key and the expected next event sequence. It is available after all strokes have saved and the history is nonempty. Successful submission preserves that history as the next numbered timelapse and clears the working canvas; failure keeps the drawing visible. Retries reuse the same completion key and sequence. History responses include start, the latest completion's sequence, so restoration shows only the current drawing. If another tab completes a history with local pending strokes, those strokes remain locally pending and are not silently moved into the next recording.

The authenticated [Timelapses](reaction:drawing.canvas.Timelapses) and [Timelapse](reaction:drawing.canvas.Timelapse) endpoints query TimeLapsing._recordings and _recording respectively. Neither accepts an owner from the client. The temporary private gallery lists submissions by ascending index, with paginated metadata and stroke loading. Selecting one previews its final state and supports play, pause, resume, and replay with adjustable speed. All original points replay in sequence, including erasures; long pauses are compressed for viewing. Reference-image association, video export, sharing, and undo remain deferred.
