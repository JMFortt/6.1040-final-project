<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { api } from "../client.ts";
import { useFollowing } from "../composables/useFollowing.ts";
import ArtistAvatar from "./ArtistAvatar.vue";
import ArtistSearch from "./ArtistSearch.vue";
import ArtistSuggestions from "./ArtistSuggestions.vue";
import PostCard, { type FeedPost } from "./PostCard.vue";

const props = defineProps<{ username: string }>();
const emit = defineEmits<{ practice: []; home: []; timelapses: [] }>();
const { followed, following, followsAnyone, loaded: peopleLoaded, loading: peopleLoading, error: peopleError, isFollowing, isPending, load: loadPeople, toggle } = useFollowing();

const posts = ref<FeedPost[]>([]);
const loading = ref(false);
const more = ref(true);
const error = ref("");
const tab = ref<"following" | "discover" | "artists">("following");
/** Artists unfollowed from the Artists tab stay listed until the tab is left, so a misclick is easy to undo. */
const unfollowedHere = ref<{ username: string; since: number }[]>([]);
const artistRows = computed(() => [...followed.value, ...unfollowedHere.value.filter(person => !isFollowing(person.username))]);

function toggleArtist(person: { username: string; since: number }) {
  if (isFollowing(person.username) && !unfollowedHere.value.some(p => p.username === person.username)) unfollowedHere.value.push(person);
  void toggle(person.username);
}
const followedOn = (since: number) => new Date(since).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
let disposed = false;

/** Following shows posts by followed artists and the viewer's own; Discover shows everyone. */
const followingPosts = computed(() => posts.value.filter(post => isFollowing(post.username) || post.username === props.username));
const shown = computed(() => tab.value === "following" ? followingPosts.value : posts.value);

async function loadPage() {
  if (loading.value || !more.value) return;
  loading.value = true;
  error.value = "";
  try {
    const result = await api.posts.feed({ before: posts.value.at(-1)?.post ?? "" });
    if ("error" in result) throw new Error(result.error === "UNAUTHORIZED" ? "Your session ended. Sign in again to browse." : "Could not load the feed. Try again.");
    if (disposed) return;
    const seen = new Set(posts.value.map(post => post.post));
    posts.value.push(...result.page.posts.filter(post => !seen.has(post.post)));
    more.value = result.page.posts.length === 20;
  } catch (cause) { error.value = cause instanceof Error ? cause.message : "Could not load the feed."; }
  finally { loading.value = false; }
}

/** The feed pages through everyone's posts, so the Following tab keeps loading until it has enough. */
async function loadMore() {
  const target = shown.value.length + 8;
  for (let pages = 0; pages < 10 && more.value && !error.value && !disposed; pages++) {
    await loadPage();
    if (shown.value.length >= target) break;
  }
}

function removed(post: string) { posts.value = posts.value.filter(p => p.post !== post); }

onMounted(async () => {
  await Promise.all([loadPeople(), loadPage()]);
  if (disposed) return;
  if (peopleLoaded.value && !followsAnyone.value) tab.value = "following";
  if (tab.value === "following" && followsAnyone.value && followingPosts.value.length < 8) void loadMore();
});
// Following someone new should bring their work into the Following tab without a reload.
watch(() => following.value.length, () => { if (tab.value === "following" && followingPosts.value.length < 8) void loadMore(); });
watch(tab, (next) => {
  if (next !== "artists") unfollowedHere.value = [];
  if (next !== "artists" && shown.value.length < 8) void loadMore();
});
onBeforeUnmount(() => { disposed = true; });
</script>

<template>
  <main class="community">
    <header class="top"><button class="home" @click="emit('home')">redraw<span>/</span></button><span class="me">{{ username }}</span><button @click="emit('timelapses')">My timelapses</button><button class="practice" @click="emit('practice')">Start Daily Practice</button></header>
    <div class="layout">
      <section class="column" aria-labelledby="feed-title">
        <p class="eyebrow">COMMUNITY</p>
        <h1 id="feed-title">Your feed</h1>
        <div class="tabs" role="tablist" aria-label="Feed">
          <button role="tab" :aria-selected="tab === 'following'" :class="{ active: tab === 'following' }" @click="tab = 'following'">Following<span v-if="following.length" class="count">{{ following.length }}</span></button>
          <button role="tab" :aria-selected="tab === 'discover'" :class="{ active: tab === 'discover' }" @click="tab = 'discover'">Discover</button>
          <button role="tab" :aria-selected="tab === 'artists'" :class="{ active: tab === 'artists' }" @click="tab = 'artists'">Artists you follow</button>
        </div>

        <!-- Everyone the viewer follows, in one place. -->
        <section v-if="tab === 'artists'" class="artists" aria-labelledby="artists-title">
          <h2 id="artists-title">Artists you follow<span v-if="following.length"> ({{ following.length }})</span></h2>
          <p v-if="peopleLoading && !peopleLoaded" role="status" class="status">Loading artists…</p>
          <p v-else-if="peopleError" class="error" role="alert">{{ peopleError }} <button @click="loadPeople">Retry</button></p>
          <div v-else-if="!artistRows.length" class="empty">
            <h2>You're not following anyone yet.</h2>
            <p>Follow artists whose process you want to learn from, and their new work will appear in your Following tab.</p>
          </div>
          <ul v-else class="artist-list">
            <li v-for="person in artistRows" :key="person.username">
              <ArtistAvatar :username="person.username" :size="44" />
              <div class="who"><strong>{{ person.username }}</strong><span>{{ isFollowing(person.username) ? `Following since ${followedOn(person.since)}` : "Unfollowed" }}</span></div>
              <button class="pill" :class="{ on: isFollowing(person.username) }" :disabled="isPending(person.username)" :aria-pressed="isFollowing(person.username)" @click="toggleArtist(person)">{{ isFollowing(person.username) ? "Unfollow" : "Follow" }}</button>
            </li>
          </ul>
          <h2 class="find">Find more artists</h2>
          <ArtistSuggestions variant="cards" :limit="6" />
        </section>

        <template v-else>
        <p v-if="error" class="error" role="alert">{{ error }} <button @click="error = ''; loadMore()">Retry</button></p>

        <!-- Encourage following when the Following tab would otherwise be empty. -->
        <section v-if="tab === 'following' && peopleLoaded && !followsAnyone" class="welcome" aria-labelledby="welcome-title">
          <h2 id="welcome-title">Fill your feed with artists who inspire you</h2>
          <p>Follow a few artists and their new timelapses will show up here. Watching how someone else builds up a drawing is one of the fastest ways to pick up new approaches.</p>
          <ArtistSuggestions variant="cards" :limit="6" />
          <button class="secondary" @click="tab = 'discover'">Or browse everyone's work in Discover</button>
        </section>

        <template v-else>
          <div v-if="tab === 'following' && !loading && !shown.length && !more" class="empty">
            <h2>No shared work from the people you follow yet.</h2>
            <p>Check back soon, or find more artists in Discover.</p>
            <button class="secondary" @click="tab = 'discover'">Go to Discover</button>
          </div>
          <div v-else-if="tab === 'discover' && !loading && !posts.length && !error" class="empty">
            <h2>Nothing shared yet.</h2>
            <p>Submit a timelapse, then share it from your timelapses to start the feed.</p>
            <button class="secondary" @click="emit('timelapses')">My timelapses</button>
          </div>
          <ol class="posts">
            <li v-for="post in shown" :key="post.post"><PostCard :post="post" :viewer="username" @retracted="removed" /></li>
          </ol>
          <p v-if="loading" role="status" class="status">Loading posts…</p>
          <button v-else-if="more && !error && shown.length" class="secondary more" @click="loadMore">Load more</button>
        </template>
        </template>
      </section>

      <aside class="sidebar" aria-label="Artists">
        <section class="panel" aria-labelledby="find-title">
          <h2 id="find-title">Find artists</h2>
          <ArtistSearch />
        </section>
        <section class="panel">
          <h2>Artists to follow</h2>
          <ArtistSuggestions variant="list" :limit="5" />
          <p v-if="peopleError" class="error" role="alert">{{ peopleError }}</p>
        </section>
        <section v-if="following.length" class="panel">
          <h2>Following</h2>
          <ul class="followed">
            <li v-for="name in following.slice(0, 8)" :key="name"><ArtistAvatar :username="name" :size="28" /><span>{{ name }}</span><button class="unfollow" :aria-label="`Unfollow ${name}`" @click="toggle(name)">Unfollow</button></li>
          </ul>
          <button class="see-all" @click="tab = 'artists'">See all {{ following.length }} artists you follow</button>
        </section>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.community { min-height: 100dvh; background: #f3f5ee; color: #27372d; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
.top { min-height: 78px; display: flex; flex-wrap: wrap; align-items: center; gap: 20px; padding: 16px 28px; border-bottom: 1px solid #dfe2d8; background: #fcfcf8; }
.me { margin-left: auto; font-size: 13px; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 10px 14px; min-height: 44px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.home { font-size: 25px; font-weight: 700; letter-spacing: -1px; background: none; border: 0; padding: 0; }
.home span { color: #929a77; }
.practice { background: #465a3d; color: white; border-color: #465a3d; font-size: 13px; }
.layout { max-width: 1040px; margin: auto; padding: 36px 28px; display: grid; grid-template-columns: minmax(0, 620px) 300px; gap: 40px; justify-content: center; }
.eyebrow { font-size: 10px; letter-spacing: 2px; color: #70776e; margin: 0; }
h1, h2 { font-family: Georgia, serif; font-weight: 400; }
h1 { font-size: 32px; margin: 10px 0 20px; }
.tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid #dfe2d8; margin-bottom: 24px; }
.tabs button { border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: none; padding: 10px 16px; color: #70776e; font-size: 14px; }
.tabs button.active { color: #27372d; border-bottom-color: #465a3d; font-weight: 600; }
.count { margin-left: 8px; font-size: 11px; background: #e9eddf; color: #465a3d; border-radius: 999px; padding: 2px 8px; }
.posts { list-style: none; margin: 0; padding: 0; display: grid; gap: 24px; }
.welcome { padding: 28px; background: #fcfcf8; border: 1px solid #dfe2d8; border-radius: 16px; display: grid; gap: 18px; }
.welcome h2 { margin: 0; font-size: 26px; }
.welcome p, .empty p { margin: 0; color: #70776e; font-size: 14px; line-height: 1.6; }
.empty { padding: 32px; border: 1px dashed #bdc6b2; border-radius: 12px; display: grid; gap: 12px; justify-items: start; margin-bottom: 24px; }
.empty h2 { margin: 0; font-size: 22px; }
.secondary { justify-self: start; font-size: 13px; }
.more { margin-top: 20px; }
.status { color: #70776e; font-size: 13px; }
.sidebar { display: grid; gap: 20px; align-content: start; position: sticky; top: 24px; }
.panel { background: white; border: 1px solid #dfe2d8; border-radius: 14px; padding: 20px; }
.panel h2 { font-size: 18px; margin: 0 0 16px; }
.followed { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.followed li { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.followed span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.unfollow { font-size: 11px; padding: 4px 10px; min-height: 28px; border-radius: 999px; color: #70776e; }
.error { color: #88492d; font-size: 13px; }
.artists { display: grid; gap: 16px; }
.artists > h2 { margin: 0; font-size: 24px; }
.artists .find { margin-top: 16px; font-size: 20px; }
.artist-list { list-style: none; margin: 0; padding: 0; background: white; border: 1px solid #dfe2d8; border-radius: 14px; }
.artist-list li { display: flex; align-items: center; gap: 14px; padding: 14px 18px; }
.artist-list li + li { border-top: 1px solid #eef0e9; }
.artist-list .who { display: grid; gap: 3px; flex: 1; min-width: 0; }
.artist-list strong { font-size: 15px; overflow: hidden; text-overflow: ellipsis; }
.artist-list span { font-size: 12px; color: #70776e; }
.pill { font-size: 13px; border-radius: 999px; padding: 6px 16px; min-height: 36px; border-color: #465a3d; background: #465a3d; color: white; }
.pill.on { background: white; color: #465a3d; }
.pill:disabled { opacity: 0.6; cursor: progress; }
.see-all { margin-top: 14px; width: 100%; font-size: 12px; min-height: 36px; padding: 6px 10px; color: #465a3d; }
@media (max-width: 900px) {
  .layout { grid-template-columns: minmax(0, 1fr); padding: 24px 16px; gap: 28px; }
  .sidebar { position: static; order: -1; }
  .top { padding: 16px; gap: 12px; }
}
</style>
