<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";

const props = defineProps<{ src: string; alt: string; caption?: string }>();
const panel = ref<HTMLElement>();
const frame = ref<HTMLElement>();
const x = ref(0);
const y = ref(0);
const width = ref(260);
const height = ref(300);
const positioned = ref(false);
const collapsed = ref(false);
const imageFailed = ref(false);
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const frameWidth = ref(1);
const frameHeight = ref(1);
const naturalWidth = ref(1);
const naturalHeight = ref(1);
const contentId = useId();
type Interaction = "move" | "resize" | "resize-left" | "pan";
const interaction = ref<Interaction | null>(null);
let observer: ResizeObserver | undefined;
let disposed = false;
let gesture: { pointer: number; clientX: number; clientY: number; originX: number; originY: number; right: number } | undefined;
const fitScale = computed(() => Math.min(frameWidth.value / naturalWidth.value, frameHeight.value / naturalHeight.value));
const imageWidth = computed(() => naturalWidth.value * fitScale.value);
const imageHeight = computed(() => naturalHeight.value * fitScale.value);
const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

function moveTo(left: number, top: number) {
  const bounds = panel.value?.getBoundingClientRect();
  if (!bounds) return;
  x.value = clamp(left, 8, window.innerWidth - bounds.width - 8);
  y.value = clamp(top, 8, window.innerHeight - bounds.height - 8);
}

function resizeTo(nextWidth: number, nextHeight: number, right?: number) {
  const maxWidth = Math.max(1, right === undefined ? window.innerWidth - x.value - 8 : right - 8);
  const maxHeight = Math.max(1, window.innerHeight - y.value - 8);
  width.value = clamp(nextWidth, Math.min(200, maxWidth), maxWidth);
  height.value = clamp(nextHeight, Math.min(200, maxHeight), maxHeight);
  if (right !== undefined) x.value = right - width.value;
}

function panTo(left: number, top: number) {
  const limitX = Math.max(0, (imageWidth.value * zoom.value - frameWidth.value) / 2);
  const limitY = Math.max(0, (imageHeight.value * zoom.value - frameHeight.value) / 2);
  panX.value = clamp(left, -limitX, limitX);
  panY.value = clamp(top, -limitY, limitY);
}

function setZoom(value: number, anchorX = 0, anchorY = 0) {
  const previous = zoom.value;
  zoom.value = clamp(value, 1, 5);
  const ratio = zoom.value / previous;
  panTo(anchorX - (anchorX - panX.value) * ratio, anchorY - (anchorY - panY.value) * ratio);
}

function fitImage() {
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
}

function wheelZoom(event: WheelEvent) {
  if (imageFailed.value) return;
  const bounds = frame.value!.getBoundingClientRect();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1);
  setZoom(zoom.value * Math.exp(-delta * 0.002), event.clientX - bounds.left - bounds.width / 2, event.clientY - bounds.top - bounds.height / 2);
}

function imageLoaded(event: Event) {
  const image = event.target as HTMLImageElement;
  naturalWidth.value = image.naturalWidth;
  naturalHeight.value = image.naturalHeight;
  fitImage();
}

function start(event: PointerEvent, kind: Interaction) {
  if (event.button !== 0 || !event.isPrimary || gesture || (kind === "pan" && (zoom.value <= 1 || imageFailed.value))) return;
  event.preventDefault();
  const handle = event.currentTarget as HTMLElement;
  handle.focus({ preventScroll: true });
  handle.setPointerCapture(event.pointerId);
  const origin = kind === "move" ? [x.value, y.value] : (kind === "resize" || kind === "resize-left") ? [width.value, height.value] : [panX.value, panY.value];
  gesture = { pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, originX: origin[0]!, originY: origin[1]!, right: x.value + width.value };
  interaction.value = kind;
}

function drag(event: PointerEvent) {
  if (!gesture || gesture.pointer !== event.pointerId) return;
  const left = gesture.originX + event.clientX - gesture.clientX;
  const top = gesture.originY + event.clientY - gesture.clientY;
  if (interaction.value === "move") moveTo(left, top);
  else if (interaction.value === "resize") resizeTo(left, top);
  else if (interaction.value === "resize-left") resizeTo(gesture.originX - (event.clientX - gesture.clientX), top, gesture.right);
  else panTo(left, top);
}

function end(event: PointerEvent) {
  if (!gesture || gesture.pointer !== event.pointerId) return;
  gesture = undefined;
  interaction.value = null;
  const handle = event.currentTarget as HTMLElement;
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
}

function withKeys(event: KeyboardEvent, kind: Interaction) {
  const delta = event.shiftKey ? 40 : 10;
  const offsets: Record<string, [number, number]> = {
    ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta],
  };
  if (kind === "pan" && ["+", "=", "-", "0"].includes(event.key)) {
    event.preventDefault();
    if (event.key === "0") fitImage();
    else setZoom(zoom.value + (event.key === "-" ? -0.25 : 0.25));
    return;
  }
  const offset = offsets[event.key];
  if (!offset) return;
  event.preventDefault();
  if (kind === "move") moveTo(x.value + offset[0], y.value + offset[1]);
  else if (kind === "resize" || kind === "resize-left") {
    const dx = kind === "resize-left" ? -offset[0] : offset[0];
    resizeTo(width.value + dx, height.value + offset[1], kind === "resize-left" ? x.value + width.value : undefined);
  } else panTo(panX.value - offset[0], panY.value - offset[1]);
}

async function keepVisible() {
  width.value = Math.min(width.value, window.innerWidth - 16);
  height.value = Math.min(height.value, window.innerHeight - 16);
  await nextTick();
  if (disposed) return;
  moveTo(x.value, y.value);
}

watch(() => props.src, () => { imageFailed.value = false; fitImage(); });

onMounted(async () => {
  width.value = window.innerWidth <= 760 ? 220 : 260;
  // Leave the drawing and submission controls visible on small screens.
  collapsed.value = window.innerWidth <= 760;
  await nextTick();
  if (disposed) return;
  moveTo(window.innerWidth - width.value - 24, window.innerWidth <= 760 ? 440 : 180);
  await keepVisible();
  if (disposed) return;
  positioned.value = true;
  observer = new ResizeObserver(() => {
    const bounds = frame.value!.getBoundingClientRect();
    // A minimized panel has no image viewport; preserve its zoom and pan.
    if (bounds.width && bounds.height) {
      frameWidth.value = bounds.width;
      frameHeight.value = bounds.height;
      panTo(panX.value, panY.value);
    }
    moveTo(x.value, y.value);
  });
  observer.observe(panel.value!);
  observer.observe(frame.value!);
  window.addEventListener("resize", keepVisible);
});

onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  window.removeEventListener("resize", keepVisible);
});
</script>

<template>
  <aside ref="panel" class="reference-panel" :class="{ interacting: interaction }" :style="{ left: `${x}px`, top: `${y}px`, width: `${width}px`, height: collapsed ? 'auto' : `${height}px`, visibility: positioned ? 'visible' : 'hidden' }" aria-label="Reference image panel">
    <div class="reference-header">
      <button class="drag-handle" type="button" aria-label="Move reference panel" title="Drag to move, or use arrow keys when focused" @pointerdown="start($event, 'move')" @pointermove="drag" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown.stop="withKeys($event, 'move')">
        <svg viewBox="0 0 16 20" aria-hidden="true"><path d="M5 4h.01M11 4h.01M5 10h.01M11 10h.01M5 16h.01M11 16h.01" /></svg>
        <span>Reference</span>
      </button>
      <button class="collapse-button" type="button" :aria-label="collapsed ? 'Expand reference image' : 'Minimize reference image'" :aria-expanded="!collapsed" :aria-controls="contentId" @click="collapsed = !collapsed">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path :d="collapsed ? 'm5 8 5 5 5-5' : 'M5 10h10'" /></svg>
      </button>
    </div>
    <div v-show="!collapsed" :id="contentId" class="reference-content">
      <div class="zoom-controls" role="group" aria-label="Reference image zoom">
        <button type="button" aria-label="Zoom out reference image" :disabled="zoom <= 1 || imageFailed" @click="setZoom(zoom - 0.25)">−</button>
        <output aria-label="Reference zoom level">{{ zoomLabel }}</output>
        <button type="button" aria-label="Zoom in reference image" :disabled="zoom >= 5 || imageFailed" @click="setZoom(zoom + 0.25)">+</button>
        <button class="fit-button" type="button" :disabled="imageFailed" title="Fit the whole image" @click="fitImage">Fit</button>
      </div>
      <div ref="frame" class="image-frame" :class="{ zoomed: zoom > 1, panning: interaction === 'pan' }" tabindex="0" role="group" aria-label="Reference image viewer. Scroll to zoom; drag or use arrow keys to pan. Press plus or minus to zoom, zero to fit." @wheel.prevent.stop="wheelZoom" @pointerdown="start($event, 'pan')" @pointermove="drag" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown.stop="withKeys($event, 'pan')">
        <img v-if="!imageFailed" :src="src" :alt="alt" :style="{ width: `${imageWidth}px`, height: `${imageHeight}px`, transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom})` }" draggable="false" @load="imageLoaded" @error="imageFailed = true" />
        <p v-else role="status">Reference image could not be loaded.</p>
      </div>
      <div class="reference-footer"><p class="caption">{{ caption || 'Reference image' }}</p><span class="resize-hint">Resize</span></div>
      <button class="resize-handle resize-left" type="button" aria-label="Resize reference panel from left corner" title="Drag left to widen, down to increase height" @pointerdown="start($event, 'resize-left')" @pointermove="drag" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown.stop="withKeys($event, 'resize-left')">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 16 11-11M11 16l5-5" /></svg>
      </button>
      <button class="resize-handle" type="button" aria-label="Resize reference panel" title="Drag to resize, or use arrow keys when focused" @pointerdown="start($event, 'resize')" @pointermove="drag" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown.stop="withKeys($event, 'resize')">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 16 11-11M11 16l5-5" /></svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.reference-panel { position: fixed; z-index: 20; display: flex; flex-direction: column; max-width: calc(100vw - 16px); max-height: calc(100dvh - 16px); overflow: hidden; color: #27372d; background: #fcfcf8; border: 1px solid #cdd4c4; border-radius: 10px; box-shadow: 0 8px 28px #25301d26, 0 1px 3px #25301d12; }
.reference-panel.interacting { box-shadow: 0 14px 36px #25301d33; }
.reference-header { display: flex; align-items: center; min-height: 42px; flex-shrink: 0; }
button { font: inherit; color: inherit; border: 0; background: transparent; cursor: pointer; }
button:disabled { opacity: .35; cursor: default; }
button:focus-visible, .image-frame:focus-visible { outline: 2px solid #567b8a; outline-offset: -3px; border-radius: 6px; }
.drag-handle { display: flex; align-items: center; align-self: stretch; gap: 7px; flex: 1; min-width: 0; padding: 10px; text-align: left; font-size: 12px; font-weight: 600; cursor: grab; touch-action: none; user-select: none; }
.drag-handle:active { cursor: grabbing; }
.drag-handle svg { width: 12px; height: 16px; fill: none; stroke: #8b9582; stroke-width: 2.5; stroke-linecap: round; }
.collapse-button { display: grid; place-items: center; width: 38px; height: 38px; margin-right: 3px; }
.collapse-button:hover, .zoom-controls button:not(:disabled):hover { background: #e9eddf; border-radius: 6px; }
.collapse-button svg, .resize-handle svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.reference-content { display: flex; flex-direction: column; flex: 1; min-height: 0; border-top: 1px solid #dfe2d8; padding: 0 10px; }
.zoom-controls { display: flex; align-items: center; gap: 4px; padding: 4px 0; flex-shrink: 0; }
.zoom-controls button { min-width: 30px; height: 32px; font-size: 18px; }
.zoom-controls output { min-width: 42px; text-align: center; font-size: 11px; font-variant-numeric: tabular-nums; }
.zoom-controls .fit-button { margin-left: auto; font-size: 11px; padding: 0 10px; }
.image-frame { position: relative; flex: 1; min-height: 0; background: #eef0e7; border-radius: 5px; overflow: hidden; touch-action: none; }
.image-frame.zoomed { cursor: grab; }
.image-frame.panning { cursor: grabbing; }
.image-frame img { position: absolute; left: 50%; top: 50%; display: block; max-width: none; user-select: none; pointer-events: none; }
.image-frame p { margin: 0; padding: 16px; text-align: center; font-size: 12px; color: #70776e; }
.reference-footer { display: flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 22px; flex-shrink: 0; }
.caption { margin: 0; font-size: 10px; color: #70776e; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.resize-hint { margin-left: auto; color: #70776e; font-size: 10px; }
.resize-handle { position: absolute; bottom: 0; right: 0; display: grid; place-items: center; width: 32px; height: 32px; cursor: nwse-resize; touch-action: none; user-select: none; }
.resize-left { left: 0; right: auto; cursor: nesw-resize; }
.resize-left svg { transform: scaleX(-1); }
.resize-handle:hover { background: #e9eddf; }
</style>
