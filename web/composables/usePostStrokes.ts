import { parseStroke, type Stroke } from "../../src/drawing/stroke.ts";
import { api } from "../client.ts";

type PostId = Parameters<typeof api.posts.timelapse>[0]["post"];

const cache = new Map<string, Promise<Stroke[]>>();

async function fetchStrokes(post: PostId): Promise<Stroke[]> {
  let after = 0;
  const strokes: Stroke[] = [];
  for (;;) {
    const result = await api.posts.timelapse({ post, after });
    if ("error" in result) throw new Error("Could not load this artwork. Try again.");
    if (!result.found) throw new Error("This post is no longer shared.");
    for (const update of result.updates) {
      const stroke = parseStroke(update.change);
      if (!stroke) throw new Error("This artwork uses an unsupported format.");
      strokes.push(stroke);
      after = update.sequence;
    }
    if (result.updates.length < 50) return strokes;
  }
}

/** Loads a posted timelapse's strokes once per page view; a failed load can be retried. */
export function loadPostStrokes(post: PostId): Promise<Stroke[]> {
  let pending = cache.get(post);
  if (!pending) {
    pending = fetchStrokes(post).catch((error: unknown) => { cache.delete(post); throw error; });
    cache.set(post, pending);
  }
  return pending;
}

export function forgetPostStrokes(post: string) { cache.delete(post); }
