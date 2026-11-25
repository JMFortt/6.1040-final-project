<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Stroke } from "../../src/drawing/stroke.ts";
import { StrokeRenderer } from "../drawing/renderer.ts";

const props = withDefaults(defineProps<{ strokes: readonly Stroke[]; index: number; loading?: boolean }>(), { loading: false });
const canvas = ref<HTMLCanvasElement>();
const playing = ref(false);
const preparing = ref(true);
const speed = ref(16);
const failure = ref("");
const fraction = ref(0);
const scrubber = ref<HTMLElement>();
const track = ref<HTMLElement>();
const scrubbing = ref(false);
let renderer: StrokeRenderer;
let stopped = false;
const running = ref(false);
const completed = ref(false);
const playable = computed(() => props.strokes.length > 0 && props.strokes.every(stroke => stroke.points.length > 0));
const percent = computed(() => Math.round(fraction.value * 100));
const canSeek = computed(() => playable.value && !props.loading && !preparing.value);
const transportLabel = computed(() => playing.value ? "Pause" : "Play");
let resume: (() => void) | undefined;
let frame = 0;
let resolveFrame: ((time: number) => void) | undefined;
let run = 0;
let shown = 0;
let showing: Promise<void> = Promise.resolve();
let cursor = 0;
let placed = false;
let openStroke = -1;
let pendingRatio: number | null = null;
let scrubJob = false;
let playWhenScrubSettles = false;
let resumeAfterScrub = false;
let playbackIdle: Promise<void> = Promise.resolve();
let rendererTurn: Promise<void> = Promise.resolve();
let generation = 0;
let anchors: { count: number; image: HTMLCanvasElement }[] = [];

function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const wait = rendererTurn;
  let release = () => {};
  rendererTurn = new Promise((resolve) => { release = resolve; });
  return wait.then(work, work).finally(release);
}

function nextFrame() {
  return new Promise<number>((resolve) => {
    resolveFrame = resolve;
    frame = requestAnimationFrame((time) => { resolveFrame = undefined; resolve(time); });
  });
}

// Every recorded point takes the same time. The handle and the frame share that
// clock, so playback does not rush through dense strokes or wait out pauses.
const POINT_MS = 20;
function pointCount() {
  return props.strokes.reduce((count, stroke) => count + stroke.points.length, 0);
}

function countAt(ratio: number, total = pointCount()) {
  if (total <= 0 || ratio <= 0) return 0;
  if (ratio >= 1) return total;
  return Math.min(total, Math.floor(ratio * total));
}

function locate(count: number) {
  let left = count;
  for (let index = 0; index < props.strokes.length; index++) {
    const points = props.strokes[index]!.points.length;
    if (left < points) return { strokeIndex: index, pointIndex: left };
    left -= points;
  }
  return { strokeIndex: props.strokes.length, pointIndex: 0 };
}

function stopPlayback() {
  generation++;
  run++;
  const wake = resume;
  resume = undefined;
  wake?.();
  cancelAnimationFrame(frame);
  resolveFrame?.(performance.now());
  renderer?.pause();
  running.value = false;
  playing.value = false;
}

function holdPlayback() {
  let release = () => {};
  playbackIdle = new Promise<void>((resolve) => { release = resolve; });
  return release;
}

async function closeOpen() {
  if (openStroke < 0) return;
  if (!renderer.idle()) renderer.flush();
  openStroke = -1;
  await renderer.finish();
}

type Step = "done" | "partial" | "aborted";

/** Stroke-end pictures. Gaps stay short so a seek can finish on its exact frame before painting. */
function anchorMarks() {
  const bounds: number[] = [];
  let count = 0;
  for (const stroke of props.strokes) {
    count += stroke.points.length;
    bounds.push(count);
  }
  const marks = new Set<number>();
  if (bounds.length === 0) return marks;
  const total = bounds.at(-1)!;
  const gap = Math.max(800, Math.ceil(total / 24));
  let next = gap;
  for (const bound of bounds) {
    if (bound < next) continue;
    marks.add(bound);
    while (next <= bound) next += gap;
  }
  marks.add(total);
  return marks;
}

function anchorAt(count: number) {
  let best = anchors[0];
  for (const anchor of anchors) {
    if (anchor.count <= count) best = anchor;
    else break;
  }
  return best;
}

function maybeCapture(marks?: Set<number>) {
  if (!marks || openStroke >= 0 || !marks.has(cursor) || anchors.some(anchor => anchor.count === cursor)) return;
  anchors.push({ count: cursor, image: renderer.capture() });
}

/** Draw forward from the current cursor. Yields so pause and the next seek can run. */
async function extendTo(target: number, alive: () => boolean, budgetMs: number, marks?: Set<number>): Promise<Step> {
  const started = performance.now();
  let burst = 0;
  while (cursor < target) {
    if (!alive() || stopped) return "aborted";
    if (!renderer.idle()) {
      if (!renderer.flush(budgetMs)) return "partial";
      continue;
    }
    if (performance.now() - started > budgetMs) return "partial";
    const { strokeIndex, pointIndex } = locate(cursor);
    if (strokeIndex >= props.strokes.length) break;
    if (openStroke !== strokeIndex) {
      if (pointIndex !== 0) return "aborted";
      if (openStroke >= 0) await closeOpen();
      if (!alive() || stopped) return "aborted";
      maybeCapture(marks);
      renderer.begin(props.strokes[strokeIndex]!, { replay: true });
      openStroke = strokeIndex;
    }
    renderer.point(props.strokes[strokeIndex]!.points[pointIndex]!, true);
    cursor++;
    burst++;
    if (burst < 120 && performance.now() - started <= budgetMs) continue;
    burst = 0;
    if (!renderer.flush(budgetMs) || performance.now() - started > budgetMs) return "partial";
  }
  if (!renderer.idle() && !renderer.flush(budgetMs)) return "partial";
  if (openStroke >= 0 && locate(cursor).pointIndex === 0) {
    await closeOpen();
    if (!alive() || stopped) return "aborted";
    maybeCapture(marks);
  }
  return !alive() || stopped ? "aborted" : "done";
}

/** Draw the exact remainder of a seek. A newer scrub can cancel it between strokes. */
async function catchUp(target: number, alive: () => boolean) {
  while (cursor < target) {
    if (!alive() || stopped) return false;
    const { strokeIndex, pointIndex } = locate(cursor);
    if (strokeIndex >= props.strokes.length) return false;
    const stroke = props.strokes[strokeIndex]!;
    if (openStroke !== strokeIndex) {
      if (pointIndex !== 0) return false;
      if (openStroke >= 0) {
        await renderer.finish();
        openStroke = -1;
        if (!alive() || stopped) return false;
      }
      renderer.begin(stroke, { replay: true });
      openStroke = strokeIndex;
    }
    const end = Math.min(stroke.points.length, pointIndex + (target - cursor));
    for (let index = pointIndex; index < end; index++) renderer.point(stroke.points[index]!, true);
    cursor += end - pointIndex;
  }
  if (openStroke >= 0 && locate(cursor).pointIndex === 0) {
    await renderer.finish();
    openStroke = -1;
  }
  return alive() && !stopped && cursor >= target;
}

/** Move the picture to a point count. A seek jumps to the nearest snapshot, then draws only the short tail. */
async function present(target: number, alive: () => boolean, marks?: Set<number>, quiet = false) {
  const total = pointCount();
  target = Math.max(0, Math.min(total, target));
  renderer.pause();
  const anchor = anchorAt(target);
  const anchorCount = anchor?.count ?? 0;
  if (target < total) completed.value = false;
  if (!placed || cursor > target || cursor < anchorCount) {
    openStroke = -1;
    if (anchor) renderer.replaceBase(anchor.image);
    else renderer.clearPicture();
    cursor = anchorCount;
    placed = true;
    // A scrub paints only the finished target. Showing the snapshot first makes the rest of the strokes pop in later.
    if (!quiet && renderer.idle()) renderer.paintFrame();
  }
  if (cursor >= total) completed.value = total > 0;
  if (quiet) {
    if (cursor < target && !await catchUp(target, alive)) {
      if (!alive() || stopped) return false;
      const fallback = anchorAt(target);
      openStroke = -1;
      if (fallback) renderer.replaceBase(fallback.image);
      else renderer.clearPicture();
      cursor = fallback?.count ?? 0;
      placed = true;
      if (cursor < target && !await catchUp(target, alive)) return false;
    }
  } else {
    let retried = false;
    while (alive() && !stopped && cursor < target) {
      const step = await extendTo(target, alive, 12, marks);
      if (!alive() || stopped) return false;
      if (step === "aborted") {
        if (retried) return false;
        retried = true;
        const fallback = anchorAt(target);
        openStroke = -1;
        if (fallback) renderer.replaceBase(fallback.image);
        else renderer.clearPicture();
        cursor = fallback?.count ?? 0;
        placed = true;
        if (renderer.idle()) renderer.paintFrame();
        continue;
      }
      if (step === "done") break;
      if (renderer.idle()) renderer.paintFrame();
      await nextFrame();
    }
  }
  if (!alive() || stopped || cursor < target) return false;
  if (!renderer.idle()) renderer.flush();
  completed.value = total > 0 && cursor >= total;
  renderer.paintFrame();
  return true;
}

function showFinished() {
  const version = ++shown;
  preparing.value = true;
  stopPlayback();
  anchors = [];
  showing = showing.then(async () => {
    if (version !== shown || !renderer || stopped) return;
    if (props.loading) {
      failure.value = "";
      await exclusive(async () => { renderer.clearPicture(); renderer.paintFrame(); });
      return;
    }
    completed.value = false;
    cursor = 0;
    placed = false;
    openStroke = -1;
    fraction.value = 0;
    if (!playable.value) {
      failure.value = "This timelapse has no playable strokes.";
      preparing.value = false;
      return;
    }
    failure.value = "";
    try {
      await nextFrame();
      await exclusive(async () => {
        if (version !== shown || stopped) return;
        const token = generation;
        const alive = () => token === generation && version === shown && !stopped;
        renderer.pause();
        renderer.clearPicture();
        anchors = [{ count: 0, image: renderer.capture() }];
        const marks = anchorMarks();
        let count = 0;
        let slice = performance.now();
        for (const stroke of props.strokes) {
          if (!alive()) return;
          renderer.begin(stroke, { replay: true });
          for (const point of stroke.points) renderer.point(point, true);
          count += stroke.points.length;
          await renderer.finish();
          if (!alive()) return;
          if (marks.has(count)) anchors.push({ count, image: renderer.capture() });
          if (performance.now() - slice > 48) {
            await new Promise((resolve) => setTimeout(resolve, 0));
            slice = performance.now();
          }
        }
        if (!alive()) return;
        renderer.paintFrame();
        cursor = 0;
        placed = false;
        openStroke = -1;
        completed.value = false;
      });
    } catch { if (version === shown) failure.value = "Could not render this timelapse."; }
    finally { if (version === shown) preparing.value = false; }
  }).catch(() => { if (version === shown) preparing.value = false; });
}

function setPlaying(next: boolean) {
  playing.value = next;
  if (next) {
    const wake = resume;
    resume = undefined;
    renderer?.paintFrame();
    wake?.();
  } else renderer?.pause();
}

function play() {
  if (props.loading || preparing.value || stopped || !playable.value || scrubbing.value) return;
  if (running.value) { setPlaying(!playing.value); return; }
  if (scrubJob) {
    const next = !playing.value;
    playing.value = next;
    playWhenScrubSettles = next;
    return;
  }
  void runPlayback(completed.value || fraction.value >= 1 || !placed ? 0 : fraction.value);
}

async function waitIfPaused(live: () => boolean) {
  if (playing.value || !live()) return playing.value && live();
  let wake = () => {};
  const waiting = new Promise<void>((resolve) => { wake = resolve; });
  resume = wake;
  renderer.pause();
  if (!renderer.idle()) renderer.flush();
  renderer.paintFrame();
  if (!playing.value) await waiting;
  resume = undefined;
  return live() && playing.value;
}

async function runPlayback(start: number) {
  const release = holdPlayback();
  const current = ++run;
  const live = () => current === run && !stopped;
  running.value = true;
  playing.value = true;
  await exclusive(async () => {
  try {
    if (!live()) return;
    completed.value = false;
    failure.value = "";
    const total = pointCount();
    const startCount = countAt(start, total);
    if (!placed || cursor !== startCount) {
      const token = generation;
      const drawn = await present(startCount, () => live() && token === generation);
      if (!live() || !drawn) return;
    }
    const span = Math.max(total, 1) * POINT_MS;
    let clock = Math.max(0, Math.min(1, start)) * span;
    let previous = performance.now();
    while (live() && clock < span) {
      if (!playing.value) {
        clock = total > 0 ? (cursor / total) * span : 0;
        fraction.value = span > 0 ? clock / span : 0;
        const resumed = await waitIfPaused(live);
        previous = performance.now();
        if (!resumed || !live()) return;
      }
      const now = await nextFrame();
      if (!live()) return;
      if (!playing.value) { previous = now; continue; }
      const elapsed = Math.max(0, Math.min(now - previous, 100));
      clock = Math.min(span, clock + elapsed * speed.value);
      previous = now;
      const nextFraction = Math.max(0, Math.min(1, clock / span));
      if (!scrubbing.value) fraction.value = nextFraction;
      const target = countAt(nextFraction, total);
      if (target > cursor) {
        const step = await extendTo(target, live, 12);
        if (!live()) return;
        if (renderer.idle()) renderer.paintFrame();
        if (!playing.value) {
          if (!renderer.idle()) renderer.flush();
          renderer.paintFrame();
          clock = total > 0 ? (cursor / total) * span : 0;
          fraction.value = span > 0 ? clock / span : 0;
        }
        if (step === "aborted") return;
      }
    }
    while (live() && playing.value && cursor < total) {
      const step = await extendTo(total, live, 12);
      if (renderer.idle()) renderer.paintFrame();
      if (step === "aborted" || !live()) return;
      if (step === "done") break;
      await nextFrame();
    }
    if (!live() || !playing.value) return;
    await closeOpen();
    renderer.paintFrame();
    completed.value = true;
    fraction.value = 1;
  } catch {
    if (live()) failure.value = "Could not replay this timelapse. Try again.";
  } finally {
    if (openStroke >= 0 && live()) await closeOpen();
    if (live()) {
      renderer.paintFrame();
      renderer.pause();
      running.value = false;
      playing.value = false;
    }
    release();
  }
  });
}

function ratioOf(event: PointerEvent) {
  const rect = track.value?.getBoundingClientRect();
  if (!rect || rect.width <= 0) return fraction.value;
  return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
}

function scheduleScrub(ratio: number) {
  fraction.value = Math.max(0, Math.min(1, ratio));
  pendingRatio = fraction.value;
  generation++;
  if (scrubJob) return;
  scrubJob = true;
  void runScrubJob();
}

async function runScrubJob() {
  try {
    for (;;) {
      if (stopped) return;
      if (pendingRatio !== null) {
        await playbackIdle;
        if (stopped) return;
        const ratio = pendingRatio;
        pendingRatio = null;
        if (ratio === null) continue;
        const token = generation;
        const drawn = await exclusive(() => present(countAt(ratio), () => token === generation && !stopped, undefined, true));
        if (stopped) return;
        if (pendingRatio !== null || generation !== token) continue;
        if (!drawn) return;
        continue;
      }
      if (playWhenScrubSettles && !scrubbing.value) {
        playWhenScrubSettles = false;
        const start = completed.value || fraction.value >= 1 || !placed ? 0 : fraction.value;
        await runPlayback(start);
        continue;
      }
      break;
    }
  } catch {
    if (!stopped) failure.value = "Could not move to that point in the timelapse.";
  } finally {
    scrubJob = false;
    if (pendingRatio !== null && !stopped) scheduleScrub(pendingRatio);
  }
}

function seekTo(ratio: number) {
  const bounded = Math.max(0, Math.min(1, ratio));
  const keepPlaying = playing.value && bounded < 1;
  resumeAfterScrub = false;
  playWhenScrubSettles = keepPlaying;
  stopPlayback();
  if (keepPlaying) playing.value = true;
  scheduleScrub(bounded);
}

function scrubDown(event: PointerEvent) {
  if (!canSeek.value || event.button !== 0) return;
  event.preventDefault();
  scrubber.value?.setPointerCapture(event.pointerId);
  resumeAfterScrub = playing.value;
  playWhenScrubSettles = false;
  scrubbing.value = true;
  stopPlayback();
  if (resumeAfterScrub) playing.value = true;
  scheduleScrub(ratioOf(event));
}

function scrubMove(event: PointerEvent) {
  if (!scrubbing.value) return;
  scheduleScrub(ratioOf(event));
}

function endScrub(ratio: number) {
  if (!scrubbing.value) return;
  scrubbing.value = false;
  const keepPlaying = resumeAfterScrub && ratio < 1;
  resumeAfterScrub = false;
  playWhenScrubSettles = keepPlaying;
  playing.value = keepPlaying;
  scheduleScrub(ratio);
}

function scrubUp(event: PointerEvent) {
  endScrub(ratioOf(event));
}

function scrubCancel() {
  endScrub(fraction.value);
}

function scrubLost(event: PointerEvent) {
  if (event.buttons !== 0) return;
  endScrub(fraction.value);
}

function scrubKey(event: KeyboardEvent) {
  if (!canSeek.value) return;
  let ratio: number | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") ratio = Math.min(1, fraction.value + 0.05);
  else if (event.key === "ArrowLeft" || event.key === "ArrowDown") ratio = Math.max(0, fraction.value - 0.05);
  else if (event.key === "Home") ratio = 0;
  else if (event.key === "End") ratio = 1;
  if (ratio === null) return;
  event.preventDefault();
  void seekTo(ratio);
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
      <canvas ref="canvas" :aria-label="`Timelapse of artwork ${index}`" />
      <p v-if="loading || preparing" class="loading" role="status">Loading strokes…</p>
    </div>
    <p v-if="failure" role="alert">{{ failure }}</p>
    <div class="playback-controls">
      <button class="transport" :aria-label="transportLabel" :disabled="loading || preparing || !playable" @click="play">
        <svg v-if="playing" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 2.2h3.2v11.6H3.2zm6.4 0h3.2v11.6H9.6z"/></svg>
        <svg v-else class="play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 2.4v11.2l9.2-5.6z"/></svg>
      </button>
      <div ref="scrubber" class="scrubber" role="slider" aria-label="Playback progress" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100" :aria-valuetext="`${percent} percent`" :aria-disabled="!canSeek" :tabindex="canSeek ? 0 : -1" @pointerdown="scrubDown" @pointermove="scrubMove" @pointerup="scrubUp" @pointercancel="scrubCancel" @lostpointercapture="scrubLost" @keydown="scrubKey">
        <div ref="track" class="track">
          <div class="fill" :style="{ width: `${fraction * 100}%` }" />
          <div class="thumb" :style="{ left: `${fraction * 100}%` }" />
        </div>
      </div>
      <label class="speed">Speed
        <select v-model.number="speed" aria-label="Playback speed">
          <option :value="4">Slow</option>
          <option :value="16">Normal</option>
          <option :value="32">Fast</option>
        </select>
      </label>
    </div>
  </section>
</template>

<style scoped>
.player { min-width: 0; }
.sheet { position: relative; }
canvas { display: block; width: 100%; aspect-ratio: 4 / 3; background: white; box-shadow: 0 2px 16px #25301d12; }
.loading { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; background: white; color: #70776e; font-size: 14px; }
.playback-controls { display: flex; align-items: center; gap: 12px; margin-top: 18px; font-size: 12px; }
button, select { font: inherit; border: 1px solid #d5dcc7; border-radius: 7px; cursor: pointer; }
button { background: #465a3d; color: white; }
.transport { flex: none; width: 44px; height: 44px; padding: 0; display: grid; place-items: center; }
.transport svg { width: 14px; height: 14px; fill: currentColor; }
.transport .play { margin-left: 2px; }
button:disabled { opacity: .5; cursor: wait; }
select { background: white; color: #27372d; padding: 8px 10px; min-height: 44px; }
.speed { flex: none; display: flex; align-items: center; gap: 8px; color: #27372d; }
.scrubber { flex: 1; min-width: 48px; height: 28px; display: flex; align-items: center; padding: 0 8px; touch-action: none; cursor: pointer; }
.scrubber[aria-disabled="true"] { cursor: default; opacity: 0.5; }
.track { position: relative; width: 100%; height: 4px; border-radius: 999px; background: #d5dcc7; }
.fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; background: #465a3d; }
.thumb { position: absolute; top: 50%; width: 14px; height: 14px; border-radius: 50%; background: white; border: 2px solid #465a3d; box-shadow: 0 1px 3px #25301d33; transform: translate(-50%, -50%); }
.scrubber:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; border-radius: 7px; }
button:focus-visible, select:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
p { color: #88492d; }
</style>
