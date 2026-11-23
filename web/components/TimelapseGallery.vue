<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { parseStroke, type Stroke } from "../../src/drawing/stroke.ts";
import { api } from "../client.ts";
import TimelapsePlayer from "./TimelapsePlayer.vue";
import ShareToggle from "./ShareToggle.vue";

defineProps<{ username: string }>();
const emit = defineEmits<{ practice: [] }>();
const recordings = ref<{ index: number; count: number; createdAt: number }[]>([]);
const pictures = ref<Record<number, string>>({});
const loading = ref(false);
const more = ref(true);
const error = ref("");
const selected = ref<number | null>(null);
const strokes = ref<Stroke[]>([]);
const opening = ref(false);
const playbackError = ref("");
let request = 0;
let disposed = false;

async function loadMore() {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    const result = await api.canvas.timelapses({ after: recordings.value.at(-1)?.index ?? 0 });
    if ("error" in result) throw new Error(result.error === "UNAUTHORIZED" ? "Your session ended. Sign in again to see your artworks." : "Could not load your artworks. Try again.");
    if (disposed) return;
    recordings.value.push(...result.recordings);
    more.value = result.recordings.length === 20;
    void loadPictures(result.recordings.map((recording) => recording.index));
  } catch (cause) { error.value = cause instanceof Error ? cause.message : "Could not load your artworks."; }
  finally { loading.value = false; }
}

async function loadPictures(indices: number[]) {
  await Promise.all(indices.map(async (index) => {
    try {
      const result = await api.canvas.picture({ index });
      if (disposed || "error" in result || !result.found || result.image.length === 0) return;
      pictures.value[index] = result.image;
    } catch { /* A missing picture leaves the row without a thumbnail. */ }
  }));
}

async function open(index: number) {
  const current = ++request;
  selected.value = index;
  opening.value = true;
  playbackError.value = "";
  strokes.value = [];
  try {
    let after = 0;
    const collected: Stroke[] = [];
    for (;;) {
      const result = await api.canvas.timelapse({ index, after });
      if (disposed || current !== request) return;
      if ("error" in result) throw new Error("Could not load this artwork. Try again.");
      if (!result.found) throw new Error("This artwork is unavailable.");
      for (const update of result.updates) {
        const stroke = parseStroke(update.change);
        if (!stroke) throw new Error("This artwork uses an unsupported format.");
        collected.push(stroke);
        after = update.sequence;
      }
      if (result.updates.length < 50) break;
    }
    strokes.value = collected;
  } catch (cause) {
    if (current === request) playbackError.value = cause instanceof Error ? cause.message : "Could not load this artwork.";
  } finally { if (current === request) opening.value = false; }
}

const date = (timestamp: number) => new Date(timestamp).toLocaleString();
onMounted(loadMore);
onBeforeUnmount(() => { disposed = true; request++; });
</script>

<template>
  <main class="gallery">
    <div class="content">
      <h1>Saved artworks</h1>
      <p v-if="error" class="error" role="alert">{{ error }} <button @click="loadMore">Retry</button></p>
      <div v-if="!loading && !error && !recordings.length" class="empty"><h2>Your first artwork starts with a mark.</h2><p>Draw on your canvas, then select Submit artwork to save it here.</p><button class="practice" @click="emit('practice')">Start Daily Practice</button></div>
      <div v-else class="archive">
        <nav aria-label="Saved artworks">
          <ol>
            <li v-for="recording in recordings" :key="recording.index"><button class="recording" :class="{ selected: selected === recording.index }" :aria-pressed="selected === recording.index" @click="open(recording.index)"><span class="label"><strong>Artwork #{{ recording.index }}</strong><time :datetime="new Date(recording.createdAt).toISOString()">{{ date(recording.createdAt) }}</time></span><span class="thumb" aria-hidden="true"><img v-if="pictures[recording.index]" alt="" :src="`data:image/webp;base64,${pictures[recording.index]}`"></span></button></li>
          </ol>
          <p v-if="loading" role="status">Loading artworks…</p>
          <button v-else-if="more && !error" @click="loadMore">Load more</button>
        </nav>
        <section class="preview" aria-label="Selected artwork">
          <h2 v-if="selected">Artwork #{{ selected }}</h2>
          <ShareToggle v-if="selected" :key="selected" :index="selected" />
          <p v-if="playbackError" class="error" role="alert">{{ playbackError }} <button @click="open(selected!)">Retry</button></p>
          <TimelapsePlayer v-else-if="selected" :key="selected" :strokes="strokes" :index="selected" :loading="opening" />
          <p v-else-if="recordings.length" class="choose">Select an artwork to preview it and play its timelapse.</p>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.gallery { min-height: calc(100dvh - 65px); background: #f3f5ee; color: #27372d; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 10px 14px; min-height: 44px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.practice { background: #465a3d; color: white; border-color: #465a3d; font-size: 13px; }
.content { max-width: 1240px; margin: auto; padding: 40px 28px; }
h1, h2 { font-family: Georgia, serif; font-weight: 400; }
h1 { font-size: 32px; margin: 0 0 12px; }
h2 { margin: 0 0 20px; font-size: 23px; }
.choose, .empty p { color: #70776e; font-size: 14px; line-height: 1.6; }
.archive { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 32px; margin-top: 30px; }
ol { list-style: none; margin: 0 0 16px; padding: 0; display: grid; gap: 12px; }
.recording { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; text-align: left; padding: 12px; }
.label { display: grid; gap: 7px; min-width: 0; }
.recording.selected { border-color: #465a3d; background: #e9eddf; }
.recording strong { font-size: 14px; }
.recording time { font-size: 11px; color: #70776e; }
.thumb { display: block; width: 72px; height: 54px; background: white; border-radius: 4px; flex: none; overflow: hidden; }
.thumb img { display: block; width: 100%; height: 100%; object-fit: contain; }
.preview { min-width: 0; }
.empty { margin-top: 32px; padding: 36px; border: 1px dashed #bdc6b2; border-radius: 12px; }
.error { color: #88492d; }
@media (max-width: 760px) { .content { padding: 24px 20px; } .archive { grid-template-columns: 1fr; gap: 24px; } ol { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); } .empty { padding: 24px; } }
</style>
