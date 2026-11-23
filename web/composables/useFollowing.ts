import { computed, ref } from "vue";
import { api } from "../client.ts";

export interface Suggestion { username: string; posts: number; latest: number; followers: number }
export interface Followed { username: string; since: number }

/** Everyone the artist follows, most recently followed first. */
const followed = ref<Followed[]>([]);
const following = computed(() => followed.value.map(person => person.username));
const suggestions = ref<Suggestion[]>([]);
const loaded = ref(false);
const loading = ref(false);
const error = ref("");
const pending = ref(new Set<string>());

/** Whom the signed-in artist follows, and artists to suggest. Shared by every feed component. */
export function useFollowing() {
  async function load() {
    if (loading.value) return;
    loading.value = true;
    error.value = "";
    try {
      const [list, suggested] = await Promise.all([api.people.following(), api.people.suggestions()]);
      if ("error" in list || "error" in suggested) throw new Error();
      followed.value = list.following.people;
      suggestions.value = suggested.suggestions.people;
      loaded.value = true;
    } catch { error.value = "Could not load artists to follow."; }
    finally { loading.value = false; }
  }

  const isFollowing = (username: string | null) => username !== null && following.value.includes(username);

  /** Follows or unfollows, updating the lists right away and rolling back if the server refuses. */
  async function toggle(username: string) {
    if (pending.value.has(username)) return;
    pending.value = new Set(pending.value).add(username);
    const wasFollowing = isFollowing(username);
    const before = { followed: followed.value, suggestions: suggestions.value };
    followed.value = wasFollowing ? followed.value.filter(person => person.username !== username) : [{ username, since: Date.now() }, ...followed.value];
    if (!wasFollowing) suggestions.value = suggestions.value.filter(person => person.username !== username);
    error.value = "";
    try {
      const result = wasFollowing ? await api.people.unfollow({ username }) : await api.people.follow({ username });
      // A conflict or missing follow means the server already matches what the page now shows.
      if ("error" in result && !(wasFollowing ? result.error === "NOT_FOUND" : result.error === "CONFLICT")) throw new Error();
    } catch {
      followed.value = before.followed;
      suggestions.value = before.suggestions;
      error.value = wasFollowing ? `Could not unfollow ${username}. Try again.` : `Could not follow ${username}. Try again.`;
    } finally {
      const next = new Set(pending.value);
      next.delete(username);
      pending.value = next;
    }
  }

  return {
    followed, following, suggestions, loaded, loading, error,
    followsAnyone: computed(() => following.value.length > 0),
    isPending: (username: string) => pending.value.has(username),
    isFollowing, load, toggle,
  };
}
