<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Stroke } from "../../src/drawing/stroke.ts";
import { api } from "../client.ts";
import { useFollowing } from "../composables/useFollowing.ts";
import { forgetPostPicture, loadPostPicture } from "../composables/usePostPicture.ts";
import { forgetPostStrokes, loadPostStrokes } from "../composables/usePostStrokes.ts";
import ArtistAvatar from "./ArtistAvatar.vue";
import DrawingPreview from "./DrawingPreview.vue";
import TimelapsePlayer from "./TimelapsePlayer.vue";

type FeedPage = Extract<Awaited<ReturnType<typeof api.posts.feed>>, { page: unknown }>["page"];
export type FeedPost = FeedPage["posts"][number];

const props = defineProps<{ post: FeedPost; viewer: string }>();
const emit = defineEmits<{ retracted: [post: string] }>();
const { isFollowing, isPending, toggle } = useFollowing();

const card = ref<HTMLElement>();
const picture = ref("");
const strokes = ref<Stroke[] | null>(null);
const loadError = ref("");
const loadingStrokes = ref(false);
const watching = ref(false);
const likes = ref(props.post.likes);
const liked = ref(props.post.liked);
const liking = ref(false);
const retracting = ref(false);
const actionError = ref("");
const mine = computed(() => props.post.username === props.viewer);
const artist = computed(() => props.post.username ?? "Unknown artist");
let observer: IntersectionObserver | undefined;

async function loadPicture() {
  loadError.value = "";
  try {
    const image = await loadPostPicture(props.post.post);
    if (image) { picture.value = image; return; }
    strokes.value = await loadPostStrokes(props.post.post);
  } catch (cause) { loadError.value = cause instanceof Error ? cause.message : "Could not load this drawing."; }
}

async function showProcess() {
  if (watching.value) { watching.value = false; return; }
  if (!strokes.value) {
    loadingStrokes.value = true;
    loadError.value = "";
    try { strokes.value = await loadPostStrokes(props.post.post); }
    catch (cause) { loadError.value = cause instanceof Error ? cause.message : "Could not load this drawing."; return; }
    finally { loadingStrokes.value = false; }
  }
  if (strokes.value) watching.value = true;
}

// The finished picture loads when the card scrolls near the screen. Strokes load to watch the process.
onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) { observer?.disconnect(); void loadPicture(); }
  }, { rootMargin: "400px" });
  if (card.value) observer.observe(card.value);
});
onBeforeUnmount(() => observer?.disconnect());

async function toggleLike() {
  if (liking.value) return;
  liking.value = true;
  actionError.value = "";
  const wasLiked = liked.value;
  liked.value = !wasLiked;
  likes.value += wasLiked ? -1 : 1;
  try {
    const result = wasLiked ? await api.posts.unlike({ post: props.post.post }) : await api.posts.like({ post: props.post.post });
    if ("error" in result && !(wasLiked ? result.error === "NOT_FOUND" : result.error === "CONFLICT")) throw new Error();
  } catch {
    liked.value = wasLiked;
    likes.value += wasLiked ? 1 : -1;
    actionError.value = "Could not update your like. Try again.";
  } finally { liking.value = false; }
}

async function retract() {
  if (retracting.value) return;
  retracting.value = true;
  actionError.value = "";
  try {
    const result = await api.posts.retract({ post: props.post.post });
    if ("error" in result && result.error !== "NOT_FOUND") throw new Error();
    forgetPostStrokes(props.post.post);
    forgetPostPicture(props.post.post);
    emit("retracted", props.post.post);
  } catch { actionError.value = "Could not unshare this post. Try again."; }
  finally { retracting.value = false; }
}

function ago(timestamp: number) {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
}
</script>

<template>
  <article ref="card" class="card" :aria-label="`${artist}'s timelapse #${post.index}`">
    <header>
      <ArtistAvatar :username="post.username" />
      <div class="who">
        <strong>{{ artist }}<span v-if="mine" class="you"> · you</span></strong>
        <time :datetime="new Date(post.createdAt).toISOString()" :title="new Date(post.createdAt).toLocaleString()">{{ ago(post.createdAt) }} · Timelapse #{{ post.index }}</time>
      </div>
      <button v-if="!mine && post.username" class="follow" :class="{ on: isFollowing(post.username) }" :disabled="isPending(post.username)" :aria-pressed="isFollowing(post.username)" @click="toggle(post.username)">
        {{ isFollowing(post.username) ? "Following" : "Follow" }}
      </button>
    </header>

    <div class="art">
      <TimelapsePlayer v-if="watching && strokes" :strokes="strokes" :index="post.index" />
      <img v-else-if="picture" class="finished" alt="" :src="`data:image/webp;base64,${picture}`">
      <DrawingPreview v-else-if="strokes" :strokes="strokes" :label="`Finished drawing by ${artist}`" />
      <div v-else class="placeholder">
        <p v-if="loadError" role="alert">{{ loadError }} <button class="link" @click="loadPicture">Retry</button></p>
        <p v-else role="status">Loading drawing…</p>
      </div>
    </div>

    <footer>
      <button class="like" :class="{ on: liked }" :disabled="liking" :aria-pressed="liked" :aria-label="liked ? 'Unlike' : 'Like'" @click="toggleLike">
        <span aria-hidden="true">{{ liked ? "♥" : "♡" }}</span> {{ likes }}
      </button>
      <button class="watch" :disabled="loadingStrokes || (!picture && !strokes)" :aria-pressed="watching" @click="showProcess">{{ watching ? "Show finished drawing" : loadingStrokes ? "Loading…" : "▶ Watch the process" }}</button>
      <button v-if="mine" class="unshare" :disabled="retracting" @click="retract">{{ retracting ? "Unsharing…" : "Unshare" }}</button>
    </footer>
    <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>
  </article>
</template>

<style scoped>
.card { background: white; border: 1px solid #dfe2d8; border-radius: 14px; overflow: hidden; }
header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
.who { display: grid; gap: 3px; flex: 1; min-width: 0; }
.who strong { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.you { font-weight: 400; color: #70776e; }
time { font-size: 11px; color: #70776e; }
.art { border-top: 1px solid #eef0e9; border-bottom: 1px solid #eef0e9; background: #fafbf7; }
.art :deep(.player) { padding: 0 16px 16px; }
.finished { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: white; }
.placeholder { aspect-ratio: 4 / 3; display: grid; place-items: center; color: #70776e; font-size: 13px; }
footer { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 12px; }
button { font: inherit; font-size: 13px; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 999px; background: white; color: #27372d; padding: 6px 14px; min-height: 36px; }
button:disabled { opacity: 0.6; cursor: default; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.follow { border-color: #465a3d; background: #465a3d; color: white; }
.follow.on { background: white; color: #465a3d; }
.like span { font-size: 15px; }
.like.on { color: #a8402e; border-color: #e7c2b9; background: #fbf1ee; }
.unshare { margin-left: auto; color: #88492d; }
.link { border: 0; padding: 0; min-height: 0; text-decoration: underline; background: none; }
.error { margin: 0 16px 12px; font-size: 12px; color: #88492d; }
</style>
