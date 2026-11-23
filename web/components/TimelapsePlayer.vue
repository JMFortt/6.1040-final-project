<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Stroke } from "../../src/drawing/stroke.ts";
import { StrokeRenderer } from "../drawing/renderer.ts";

const props = withDefaults(defineProps<{ strokes: readonly Stroke[]; index: number; loading?: boolean }>(), { loading: false });
const canvas = ref<HTMLCanvasElement>();
const playing = ref(false);
const preparing = ref(true);
const progress = ref(0);
const speed = ref(4);
const failure = ref("");
let renderer: StrokeRenderer;
let stopped = false;
const running = ref(false);
const completed = ref(false);
const playable = computed(() => props.strokes.length > 0 && props.strokes.every(stroke => stroke.points.length > 0));
let resume: (() => void) | undefined;
let frame = 0;
let resolveFrame: ((time: number) => void) | undefined;
let run = 0;
let shown = 0;
let showing: Promise<void> = Promise.resolve();

function nextFrame() {
  return new Promise<number>((resolve) => {
    resolveFrame = resolve;
    frame = requestAnimationFrame((time) => { resolveFrame = undefined; resolve(time); });
  });
}

// Replay every recorded point in order. Compress long pauses so practice sessions
// remain watchable; speed changes affect playback only, never the stored events.
function stopPlayback() {
  run++;
  resume?.();
  cancelAnimationFrame(frame);
  resolveFrame?.(performance.now());
  renderer?.pause();
  running.value = false;
  playing.value = false;
}

function showFinished() {
  const generation = ++shown;
  if (props.loading) stopPlayback();
  showing = showing.then(async () => {
    if (generation !== shown || !renderer || stopped) return;
    renderer.resume();
    preparing.value = true;
    if (props.loading) {
      failure.value = "";
      await renderer.restore([]);
      return;
    }
    completed.value = false;
    progress.value = 0;
    if (!playable.value) {
      failure.value = "This timelapse has no playable strokes.";
      preparing.value = false;
      return;
    }
    failure.value = "";
    try { await renderer.restore(props.strokes); }
    catch { if (generation === shown) failure.value = "Could not render this timelapse."; }
    finally { if (generation === shown) preparing.value = false; }
  }).catch(() => { if (generation === shown) preparing.value = false; });
}

async function play() {
  if (props.loading || preparing.value || stopped || !playable.value) return;
  if (running.value) {
    playing.value = !playing.value;
    if (playing.value) {
      renderer.resume();
      resume?.();
      resume = undefined;
    } else renderer.pause();
    return;
  }
  const current = ++run;
  const live = () => current === run && !stopped;
  running.value = true;
  playing.value = true;
  completed.value = false;
  progress.value = 0;
  failure.value = "";
  try {
    renderer.resume();
    await renderer.restore([]);
    if (!live()) return;
    const total = props.strokes.reduce((count, stroke) => count + stroke.points.length, 0);
    let rendered = 0;
    for (const stroke of props.strokes) {
      if (!live()) return;
      renderer.begin(stroke);
      let point = 0;
      let elapsed = 0;
      let previous = performance.now();
      const duration = Math.max(1, stroke.points.at(-1)!.time);
      const compressedDuration = Math.max(120, Math.min(duration, 3000));
      while (point < stroke.points.length) {
        if (!playing.value) {
          await new Promise<void>((resolve) => { resume = resolve; });
          previous = performance.now();
          if (!live()) return;
        }
        const now = await nextFrame();
        if (!live()) return;
        if (playing.value) {
          elapsed += Math.min(now - previous, 100) * speed.value;
          // Bound work per frame without dropping any points.
          let batch = 0;
          while (point < stroke.points.length && batch < 128
            && stroke.points[point]!.time / duration * compressedDuration <= elapsed) {
            renderer.point(stroke.points[point++]!);
            rendered++;
            batch++;
          }
          progress.value = total > 0 ? Math.round(rendered / total * 100) : 0;
        }
        previous = now;
      }
      await renderer.finish();
      if (!live()) return;
    }
    if (live()) completed.value = true;
  } catch {
    if (live()) failure.value = "Could not replay this timelapse. Try again.";
  } finally {
    if (live()) {
      renderer.pause();
      running.value = false;
      playing.value = false;
    }
  }
}

onMounted(async () => {
  renderer = new StrokeRenderer(canvas.value!);
  await showFinished();
});
watch(() => [props.loading, props.strokes] as const, () => { void showFinished(); });
onBeforeUnmount(() => {
  stopped = true;
  stopPlayback();
  renderer?.dispose();
});
</script>

<template>
  <section class="player" :aria-label="`Timelapse ${index} playback`">
    <div class="sheet">
      <canvas ref="canvas" :aria-label="`Drawing from timelapse ${index}`" />
      <p v-if="loading || preparing" class="loading" role="status">Loading strokes…</p>
    </div>
    <p v-if="failure" role="alert">{{ failure }}</p>
    <div class="playback-controls">
      <button class="transport" :disabled="loading || preparing || !playable" @click="play"><span>{{ playing ? 'Pause' : running ? 'Resume' : completed ? 'Replay' : 'Play timelapse' }}</span><span class="sizer" aria-hidden="true">Play timelapse</span></button>
      <label>Speed <select v-model.number="speed"><option :value="1">1×</option><option :value="4">4×</option><option :value="8">8×</option></select></label>
      <progress :value="progress" max="100" aria-label="Playback progress" />
      <span>{{ progress }}%</span>
    </div>
  </section>
</template>

<style scoped>
.player { min-width: 0; }
.sheet { position: relative; }
canvas { display: block; width: 100%; aspect-ratio: 4 / 3; background: white; box-shadow: 0 2px 16px #25301d12; }
.loading { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; background: white; color: #70776e; font-size: 14px; }
.playback-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 18px; font-size: 12px; }
button, select { font: inherit; border: 1px solid #d5dcc7; border-radius: 7px; padding: 9px 12px; cursor: pointer; }
button { background: #465a3d; color: white; min-height: 44px; }
.transport { display: inline-grid; place-items: center; white-space: nowrap; }
.transport > span { grid-area: 1 / 1; }
.sizer { visibility: hidden; }
button:disabled { opacity: .5; cursor: wait; }
select { background: white; color: #27372d; }
label { display: flex; align-items: center; gap: 8px; }
progress { flex: 1; min-width: 60px; accent-color: #465a3d; }
button:focus-visible, select:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
p { color: #88492d; }
</style>
