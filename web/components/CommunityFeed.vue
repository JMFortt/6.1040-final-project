<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { api } from "../client.ts";
import { useFollowing } from "../composables/useFollowing.ts";
import ArtistSuggestions from "./ArtistSuggestions.vue";
import PostCard, { type FeedPost } from "./PostCard.vue";

/** The community feed, shown on Home below the practice controls. */
const props = defineProps<{ username: string }>();
const emit = defineEmits<{ timelapses: []; artists: [] }>();
const { following, followsAnyone, loaded: peopleLoaded, isFollowing, load: loadPeople } = useFollowing();

const posts = ref<FeedPost[]>([]);
const loading = ref(false);
const more = ref(true);
const error = ref("");
const tab = ref<"following" | "discover">("following");
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
    if (result && "error" in result) throw new Error(result.error === "UNAUTHORIZED" ? "Your session ended. Sign in again to browse." : "Could not load the feed. Try again.");
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
  if (tab.value === "following" && followsAnyone.value && followingPosts.value.length < 8) void loadMore();
});
// Following someone new should bring their work into the Following tab without a reload.
watch(() => following.value.length, () => { if (tab.value === "following" && followingPosts.value.length < 8) void loadMore(); });
watch(tab, () => { if (shown.value.length < 8) void loadMore(); });
onBeforeUnmount(() => { disposed = true; });
</script>

<template>
  <section class="feed" aria-labelledby="feed-title">
    <div class="head">
      <h2 id="feed-title">Community feed</h2>
      <button class="link" @click="emit('artists')">Find artists to follow</button>
    </div>
    <div class="tabs" role="tablist" aria-label="Feed">
      <button role="tab" :aria-selected="tab === 'following'" :class="{ active: tab === 'following' }" @click="tab = 'following'">Following<span v-if="following.length" class="count">{{ following.length }}</span></button>
      <button role="tab" :aria-selected="tab === 'discover'" :class="{ active: tab === 'discover' }" @click="tab = 'discover'">Discover</button>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }} <button @click="error = ''; loadMore()">Retry</button></p>

    <!-- Encourage following when the Following tab would otherwise be empty. -->
    <section v-if="tab === 'following' && peopleLoaded && !followsAnyone" class="welcome" aria-labelledby="follow-title">
      <h3 id="follow-title">Fill your feed with artists who inspire you</h3>
      <p>Follow a few artists and their new artworks will show up here. Watching how someone else builds up an artwork is one of the fastest ways to pick up new approaches.</p>
      <ArtistSuggestions variant="cards" :limit="6" />
      <button class="secondary" @click="tab = 'discover'">Or browse everyone's work in Discover</button>
    </section>

    <template v-else>
      <div v-if="tab === 'following' && !loading && !shown.length && !more" class="empty">
        <h3>No shared work from the people you follow yet.</h3>
        <p>Check back soon, or browse everyone's work in Discover.</p>
        <button class="secondary" @click="tab = 'discover'">Go to Discover</button>
      </div>
      <div v-else-if="tab === 'discover' && !loading && !posts.length && !error" class="empty">
        <h3>Nothing shared yet.</h3>
        <p>Submit an artwork, then share it from My artworks to start the feed.</p>
        <button class="secondary" @click="emit('timelapses')">My artworks</button>
      </div>
      <ol class="posts">
        <li v-for="post in shown" :key="post.post"><PostCard :post="post" :viewer="username" @retracted="removed" /></li>
      </ol>
      <p v-if="loading" role="status" class="status">Loading posts…</p>
      <button v-else-if="more && !error && shown.length" class="secondary more" @click="loadMore">Load more</button>
    </template>
  </section>
</template>

<style scoped>
.feed { display: grid; gap: 0; }
.head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
h2, h3 { font-family: Georgia, serif; font-weight: 400; margin: 0; }
h2 { font-size: 26px; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 10px 14px; min-height: 44px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.link { border: 0; background: none; padding: 0; min-height: 0; color: #465a3d; font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }
.tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid #dfe2d8; margin-bottom: 24px; }
.tabs button { border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: none; padding: 10px 16px; color: #70776e; font-size: 14px; }
.tabs button.active { color: #27372d; border-bottom-color: #465a3d; font-weight: 600; }
.count { margin-left: 8px; font-size: 11px; background: #e9eddf; color: #465a3d; border-radius: 999px; padding: 2px 8px; }
.posts { list-style: none; margin: 0; padding: 0; display: grid; gap: 24px; }
.welcome { padding: 28px; background: #fcfcf8; border: 1px solid #dfe2d8; border-radius: 16px; display: grid; gap: 18px; }
.welcome h3 { font-size: 24px; }
.welcome p, .empty p { margin: 0; color: #70776e; font-size: 14px; line-height: 1.6; }
.empty { padding: 32px; border: 1px dashed #bdc6b2; border-radius: 12px; display: grid; gap: 12px; justify-items: start; margin-bottom: 24px; }
.empty h3 { font-size: 22px; }
.secondary { justify-self: start; font-size: 13px; }
.more { margin-top: 20px; }
.status { color: #70776e; font-size: 13px; }
.error { color: #88492d; font-size: 13px; }
</style>
