<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { api } from "../client.ts";
import { useFollowing } from "../composables/useFollowing.ts";
import ArtistAvatar from "./ArtistAvatar.vue";

/** Finds artists by the start of their username and lets the viewer follow them in place. */
type Results = Extract<Awaited<ReturnType<typeof api.people.search>>, { results: unknown }>["results"]["people"];

const { isFollowing, isPending, toggle } = useFollowing();
const text = ref("");
const results = ref<Results>([]);
const searching = ref(false);
const searched = ref("");
const error = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;
let request = 0;

const USERNAME = /^[A-Za-z0-9_-]{1,32}$/;

async function search(prefix: string) {
  const current = ++request;
  searching.value = true;
  error.value = "";
  try {
    const result = await api.people.search({ prefix });
    if (current !== request) return;
    if ("error" in result) throw new Error();
    results.value = result.results.people;
    searched.value = prefix;
  } catch { if (current === request) error.value = "Search failed. Try again."; }
  finally { if (current === request) searching.value = false; }
}

// Search shortly after typing stops, and only for text a username could start with.
watch(text, (value) => {
  clearTimeout(timer);
  const prefix = value.trim().replace(/^@/, "");
  if (prefix === "") { request++; results.value = []; searched.value = ""; error.value = ""; searching.value = false; return; }
  if (!USERNAME.test(prefix)) { request++; results.value = []; searched.value = prefix; error.value = ""; searching.value = false; return; }
  timer = setTimeout(() => void search(prefix), 250);
});
onBeforeUnmount(() => { clearTimeout(timer); request++; });

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
</script>

<template>
  <div class="search">
    <label for="artist-search" class="label">Search by username</label>
    <input id="artist-search" v-model="text" type="search" placeholder="e.g. mira" autocomplete="off" spellcheck="false" maxlength="33" aria-describedby="artist-search-status" />
    <p id="artist-search-status" class="status" role="status">
      <template v-if="searching">Searching…</template>
      <template v-else-if="error">{{ error }}</template>
      <template v-else-if="searched && !results.length">No artists start with “{{ searched }}”.</template>
    </p>
    <ul v-if="results.length" aria-label="Search results">
      <li v-for="artist in results" :key="artist.username">
        <ArtistAvatar :username="artist.username" :size="32" />
        <div class="who"><strong>{{ artist.username }}</strong><span>{{ plural(artist.followers, "follower") }}</span></div>
        <button class="follow" :class="{ on: isFollowing(artist.username) }" :disabled="isPending(artist.username)" :aria-pressed="isFollowing(artist.username)" @click="toggle(artist.username)">
          {{ isFollowing(artist.username) ? "Following" : "Follow" }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search { display: grid; gap: 8px; }
.label { font-size: 12px; color: #70776e; }
input { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; padding: 10px 12px; min-height: 44px; border: 1px solid #d5dcc7; border-radius: 8px; background: #fcfcf8; color: #27372d; }
input:focus-visible { outline: 2px solid #567b8a; outline-offset: 2px; }
.status { margin: 0; min-height: 0; font-size: 12px; color: #70776e; }
.status:empty { display: none; }
ul { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 10px; }
li { display: flex; align-items: center; gap: 10px; min-width: 0; }
.who { display: grid; gap: 2px; flex: 1; min-width: 0; }
.who strong { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.who span { font-size: 11px; color: #70776e; }
.follow { font: inherit; font-size: 12px; cursor: pointer; border: 1px solid #465a3d; border-radius: 999px; background: #465a3d; color: white; padding: 5px 12px; min-height: 32px; }
.follow.on { background: white; color: #465a3d; }
.follow:disabled { opacity: 0.6; cursor: progress; }
.follow:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
</style>
