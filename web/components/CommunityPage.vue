<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useFollowing } from "../composables/useFollowing.ts";
import ArtistAvatar from "./ArtistAvatar.vue";
import ArtistSearch from "./ArtistSearch.vue";
import ArtistSuggestions from "./ArtistSuggestions.vue";

/** Finding and managing the artists whose work appears in the Home feed. */
const { followed, following, loaded, loading, error, isFollowing, isPending, load, toggle } = useFollowing();

/** Artists unfollowed here stay listed until the page is left, so a misclick is easy to undo. */
const unfollowedHere = ref<{ username: string; since: number }[]>([]);
const rows = computed(() => [...followed.value, ...unfollowedHere.value.filter(person => !isFollowing(person.username))]);

function toggleArtist(person: { username: string; since: number }) {
  if (isFollowing(person.username) && !unfollowedHere.value.some(p => p.username === person.username)) unfollowedHere.value.push(person);
  void toggle(person.username);
}
const followedOn = (since: number) => new Date(since).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

onMounted(load);
</script>

<template>
  <main class="community">
    <div class="content">
      <p class="eyebrow">COMMUNITY</p>
      <h1>Artists</h1>
      <p class="intro">Follow artists whose process you want to learn from. Their shared artworks appear in the Following tab of your feed on Home.</p>

      <div class="layout">
        <section class="column" aria-labelledby="following-title">
          <h2 id="following-title">Artists you follow<span v-if="following.length"> ({{ following.length }})</span></h2>
          <p v-if="loading && !loaded" role="status" class="status">Loading artists…</p>
          <p v-else-if="error" class="error" role="alert">{{ error }} <button @click="load">Retry</button></p>
          <div v-else-if="!rows.length" class="empty">
            <h3>You're not following anyone yet.</h3>
            <p>Search for an artist by username, or start with the suggestions below.</p>
          </div>
          <ul v-else class="artist-list">
            <li v-for="person in rows" :key="person.username">
              <ArtistAvatar :username="person.username" :size="44" />
              <div class="who"><strong>{{ person.username }}</strong><span>{{ isFollowing(person.username) ? `Following since ${followedOn(person.since)}` : "Unfollowed" }}</span></div>
              <button class="pill" :class="{ on: isFollowing(person.username) }" :disabled="isPending(person.username)" :aria-pressed="isFollowing(person.username)" @click="toggleArtist(person)">{{ isFollowing(person.username) ? "Unfollow" : "Follow" }}</button>
            </li>
          </ul>

          <h2 class="suggested">Artists to follow</h2>
          <ArtistSuggestions variant="cards" :limit="6" />
        </section>

        <aside class="sidebar">
          <section class="panel" aria-labelledby="find-title">
            <h2 id="find-title">Find artists</h2>
            <ArtistSearch />
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.community { min-height: calc(100dvh - 65px); background: #f3f5ee; color: #27372d; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
.content { max-width: 1040px; margin: auto; padding: 36px 28px; }
.eyebrow { font-size: 10px; letter-spacing: 2px; color: #70776e; margin: 0; }
h1, h2, h3 { font-family: Georgia, serif; font-weight: 400; margin: 0; }
h1 { font-size: 32px; margin: 10px 0 12px; }
h2 { font-size: 22px; margin-bottom: 16px; }
.intro { margin: 0; color: #70776e; font-size: 14px; line-height: 1.6; max-width: 60ch; }
.layout { display: grid; grid-template-columns: minmax(0, 620px) 300px; gap: 40px; margin-top: 32px; }
.column { display: grid; align-content: start; }
.suggested { margin-top: 36px; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 10px 14px; min-height: 44px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.empty { padding: 28px; border: 1px dashed #bdc6b2; border-radius: 12px; display: grid; gap: 10px; }
.empty h3 { font-size: 20px; }
.empty p { margin: 0; color: #70776e; font-size: 14px; line-height: 1.6; }
.artist-list { list-style: none; margin: 0; padding: 0; background: white; border: 1px solid #dfe2d8; border-radius: 14px; }
.artist-list li { display: flex; align-items: center; gap: 14px; padding: 14px 18px; }
.artist-list li + li { border-top: 1px solid #eef0e9; }
.who { display: grid; gap: 3px; flex: 1; min-width: 0; }
.who strong { font-size: 15px; overflow: hidden; text-overflow: ellipsis; }
.who span { font-size: 12px; color: #70776e; }
.pill { font-size: 13px; border-radius: 999px; padding: 6px 16px; min-height: 36px; border-color: #465a3d; background: #465a3d; color: white; }
.pill.on { background: white; color: #465a3d; }
.pill:disabled { opacity: 0.6; cursor: progress; }
.sidebar { display: grid; gap: 20px; align-content: start; position: sticky; top: 90px; }
.panel { background: white; border: 1px solid #dfe2d8; border-radius: 14px; padding: 20px; }
.panel h2 { font-size: 18px; }
.status { color: #70776e; font-size: 13px; }
.error { color: #88492d; font-size: 13px; }
@media (max-width: 900px) {
  .content { padding: 24px 16px; }
  .layout { grid-template-columns: minmax(0, 1fr); gap: 28px; }
  .sidebar { position: static; order: -1; }
}
</style>
