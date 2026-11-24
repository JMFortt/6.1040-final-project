# 6.1040 Final Project
## Aden A., Eric A., Julia F., Amina L.

The team bios are available [here](team.md).

Class principles, the sync-engine stack, and notes on our design goals are in [agents/](agents/README.md).

The mentor meeting notes for the project are available [here](mentor-meetings/mentor-meetings.md).

Our problem framing deliverables are available [here](deliverables/F2/F2.md)

Our concept design deliverables are available [here](deliverables/F3/main.md)

Our Alpha checkpoint deliverables are available [here](deliverables/F4/F4.md)

**Demo Video:**
Available [here](https://www.youtube.com/watch?v=zkQu29Jh5wg).

## Running the app

Redraw includes account sign-in and one persistent private drawing canvas per artist. The canvas uses Easy-Brush for a pressure-sensitive ink pen, dry brush, graphite, and an eraser. Color, size, opacity, and zoom controls work with a mouse, touch, or pen.

Copy `.env.example` to `.env` if you do not already have one. Then, from this folder:

| Command | What it does |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run db:up` | Start local MongoDB (Podman) |
| `bun run dev` | MongoDB, the API on port 3000, and the Vue app at http://127.0.0.1:8080 |
| `bun test` | Concept, sign-in, canvas, and timelapse submission tests. Needs MongoDB running |
| `bun run check` | Spec, generated artifacts, and TypeScript |
| `bun run down` | Stop the Podman containers |

Open http://127.0.0.1:8080, create an account, and sign in. The original signed-in screen includes a **Start Daily Practice** button that opens your canvas. Each completed stroke autosaves to MongoDB; reopening the canvas reconstructs the same drawing, including erased areas. The save indicator shows pending saves and offers Retry after a connection failure. If the server rejects a stroke as invalid, drawing pauses and the mark stays visible until you choose **Discard rejected stroke**; the remaining strokes can then save. Keep the page open until all strokes are saved. In-app navigation waits for drawing and saving to finish. Shortcuts: B for ink, D for dry brush, G for graphite, E for eraser, and [ / ] for size. Actual pressure requires compatible pen hardware; mouse strokes use fixed pressure.

Use the canvas **+ / −** buttons or scroll over the page to zoom from 10% to 500%. Scrolling zooms around the pointer. **Fit** brings the full page back into view. Turn **Pan** on to drag the enlarged canvas with a mouse, pen, or touch; turn it off or choose a brush to resume drawing. A mouse's middle button also pans. Zoom and pan only change the view; saved strokes keep the original canvas coordinates.

After strokes finish saving, **Submit timelapse** preserves the current drawing as **Timelapse #1**, **#2**, and so on, then clears the canvas for a new drawing. The canvas clears only after the submission is confirmed; if a response is lost, **Retry submission** reuses the same submission instead of creating a duplicate. Empty canvases cannot be submitted.

Select **View saved timelapses** on the signed-in home screen or canvas to open the temporary private gallery. Submissions appear in ascending index order. Choose a recording to preview it, then play, pause, resume, or replay its strokes at 1×, 4×, or 8× speed. Playback preserves all points and erasures while compressing long pauses. These indices will later be associated with reference images.

TimeLapsing stores ordered, versioned stroke events with coordinates, pressure, timing, brush settings, and canvas dimensions. Each update is stored separately, with retry-safe identifiers and paginated restoration. Submission adds an immutable boundary in the same event log, so archiving and starting the next blank canvas happen atomically. Existing drawings become the first unsubmitted history without migration. Video file export and the other practice concepts remain deferred.

The canvas includes a floating reference image panel. Drag its **Reference** header to move it and either bottom corner to resize it, using a mouse, pen, or touch. Focus those handles and use arrow keys for keyboard control (Shift moves farther). Use **+ / −** or scroll over the image to zoom up to 500%, drag the enlarged image to pan, and click **Fit** to see the whole image again. When the image viewer has focus, arrow keys pan, + / − zoom, and 0 resets to Fit. The header's minus button minimizes the panel; on small screens it starts minimized to keep the canvas controls visible. To change the image, replace `web/assets/reference-placeholder.png` or change the image import, alt text, and caption in `web/drawing/reference.ts`. This is a local placeholder; selecting references from a bank is still deferred.

`bun run dev` keeps watching files. Stop it with Ctrl+C. MongoDB keeps running until `bun run down` or `bun run db:reset` (reset deletes local data).
