import { api } from "../client.ts";

type PostId = Parameters<typeof api.posts.picture>[0]["post"];

const cache = new Map<string, Promise<string>>();

async function fetchPicture(post: PostId): Promise<string> {
  const result = await api.posts.picture({ post });
  if ("error" in result) throw new Error("Could not load this drawing. Try again.");
  return result.found ? result.image : "";
}

/** Loads a posted timelapse's stored picture once per page view. An empty string means it has none. */
export function loadPostPicture(post: PostId): Promise<string> {
  let pending = cache.get(post);
  if (!pending) {
    pending = fetchPicture(post).catch((error: unknown) => { cache.delete(post); throw error; });
    cache.set(post, pending);
  }
  return pending;
}

export function forgetPostPicture(post: string) { cache.delete(post); }
