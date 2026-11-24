<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CANVAS_HEIGHT, CANVAS_WIDTH, MAX_POINTS, parseStroke, RENDERER, type Stroke, type StrokePoint, type Tool } from "../../src/drawing/stroke.ts";
import { StrokeRenderer } from "../drawing/renderer.ts";
import { useCanvasHistory } from "../composables/useCanvasHistory.ts";
import ToolIcon from "./ToolIcon.vue";
import ReferencePanel from "./ReferencePanel.vue";
import { api } from "../client.ts";

/** The practice runs for 15 minutes, starting at the first stroke. */
const PRACTICE_MS = 15 * 60 * 1000;
const FUNDAMENTALS = ["anatomy", "perspective", "color", "lighting", "form"] as const;
const label = (tag: string) => tag.slice(0, 1).toUpperCase() + tag.slice(1);

const emit = defineEmits<{ timelapses: []; busy: [locked: boolean] }>();
const practicing = ref(false);
const sessionReady = ref(false);
const sessionError = ref("");
const choosing = ref("");
const chooseError = ref("");
const reference = ref<{ source: string; credit: string } | null>(null);
const startedAt = ref(0);
const ticking = ref(Date.now());
const discarding = ref(false);
let clockTimer: number | undefined;
let arming = false;
const canvas = ref<HTMLCanvasElement>();
const stage = ref<HTMLDivElement>();
const viewX = ref(0);
const viewY = ref(0);
const tool = ref<Tool>("ink");
const color = ref("#252b25");
const size = ref(8);
const opacity = ref(100);
const zoom = ref("fit");
const fitScale = ref(0.75);
const panMode = ref(false);
const panning = ref(false);
const picking = ref(false);
let pan: { pointer: number; x: number; y: number; viewX: number; viewY: number } | undefined;
let zooming = false;
const ready = ref(false);
const restoring = ref(false);
const drawing = ref(false);
const finishing = ref(false);
const cursor = ref<{ x: number; y: number } | null>(null);
const tools: { id: Tool; name: string; key: string; size: number }[] = [
  { id: "ink", name: "Ink pen", key: "B", size: 8 },
  { id: "dry-brush", name: "Dry brush", key: "D", size: 36 },
  { id: "graphite", name: "Graphite", key: "G", size: 18 },
  { id: "eraser", name: "Eraser", key: "E", size: 40 },
];
const palette = ["#252b25", "#ffffff", "#567b8a", "#8e913d", "#be7256", "#675577", "#d6b16e", "#b85e65"];
const toolSize = Object.fromEntries(tools.map((entry) => [entry.id, entry.size])) as Record<Tool, number>;
const scale = computed(() => zoom.value === "fit" ? fitScale.value : Number(zoom.value));
let renderer: StrokeRenderer | undefined;
let active: { stroke: Stroke; pointer: number; started: number; timestamp: number } | undefined;
let finishPromise: Promise<void> = Promise.resolve();
let resize: ResizeObserver | undefined;
let disposed = false;

const storage = useCanvasHistory(async (strokes, mode = "replace") => {
  const quiet = mode !== "replace";
  if (!quiet) restoring.value = true;
  try {
    if (active) await endStroke();
    await finishPromise;
    if (disposed || !renderer) return;
    if (mode === "undo" && renderer.canRewind()) {
      renderer.rewind();
      return;
    }
    if (mode === "redo" && renderer.canReplay()) {
      renderer.replayForward();
      return;
    }
    if (mode === "redo") {
      const stroke = strokes.at(-1);
      if (stroke) await renderer.append(stroke);
      return;
    }
    const pendingStrokes = quiet ? [] : storage.pending.value.map((item) => parseStroke(item.change)).filter((stroke) => stroke !== null);
    await renderer.restore([...strokes, ...pendingStrokes], { quiet });
  } finally { if (!quiet) restoring.value = false; }
});
const { pending, saved, canUndo, canRedo, saving, loading, error, unsaved, submitting, submissionPending, blocked, rejectedKey, abandon } = storage;
const remaining = computed(() => startedAt.value ? Math.min(PRACTICE_MS, Math.max(0, startedAt.value + PRACTICE_MS - ticking.value)) : PRACTICE_MS);
const clockLabel = computed(() => {
  const seconds = Math.ceil(remaining.value / 1000);
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
});
const locked = computed(() => practicing.value && startedAt.value > 0 && remaining.value <= 0);
const navigationDisabled = computed(() => unsaved.value || drawing.value || finishing.value || saving.value || submitting.value || blocked.value);
watch(navigationDisabled, (locked) => emit("busy", locked), { immediate: true });
const status = computed(() => loading.value || restoring.value ? "Restoring canvas…"
  : submitting.value ? "Submitting artwork…"
  : error.value ? "Not saved" : saving.value || unsaved.value ? "Saving artwork…"
  : saved.value ? "Artwork saved" : "Ready to draw");

function chooseTool(next: Tool) {
  if (locked.value) return;
  toolSize[tool.value] = size.value;
  panMode.value = false;
  if (next === "eraser") picking.value = false;
  tool.value = next;
  size.value = toolSize[next];
}

function togglePick() {
  if (tool.value === "eraser" || !ready.value || restoring.value || drawing.value || panning.value) return;
  picking.value = !picking.value;
  cursor.value = null;
  if (picking.value) panMode.value = false;
}

function readCanvasColor(event: PointerEvent): string | undefined {
  const element = canvas.value;
  if (!element?.width || !element.height) return;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.min(element.width - 1, Math.max(0, Math.floor((event.clientX - rect.left) * element.width / rect.width)));
  const y = Math.min(element.height - 1, Math.max(0, Math.floor((event.clientY - rect.top) * element.height / rect.height)));
  const pixel = element.getContext("2d")?.getImageData(x, y, 1, 1).data;
  if (!pixel) return;
  const cover = pixel[3]! / 255;
  const channel = (value: number) => Math.round(value * cover + 255 * (1 - cover)).toString(16).padStart(2, "0");
  return `#${channel(pixel[0]!)}${channel(pixel[1]!)}${channel(pixel[2]!)}`;
}

function centerSheet() {
  const viewport = stage.value;
  if (!viewport) return;
  viewX.value = (viewport.clientWidth - CANVAS_WIDTH * scale.value) / 2;
  viewY.value = (viewport.clientHeight - CANVAS_HEIGHT * scale.value) / 2;
}

function releaseFit() {
  if (zoom.value === "fit") zoom.value = String(scale.value);
}

async function setZoom(value: number | "fit", anchor?: { x: number; y: number }) {
  if (!stage.value || !canvas.value || drawing.value || panning.value || zooming) return;
  const viewport = stage.value;
  const bounds = viewport.getBoundingClientRect();
  const point = anchor ?? { x: bounds.left + viewport.clientWidth / 2, y: bounds.top + viewport.clientHeight / 2 };
  const before = canvas.value.getBoundingClientRect();
  const localX = before.width ? (point.x - before.left) / before.width * CANVAS_WIDTH : 0;
  const localY = before.height ? (point.y - before.top) / before.height * CANVAS_HEIGHT : 0;
  zooming = true;
  cursor.value = null;
  zoom.value = value === "fit" ? "fit" : String(Math.max(0.1, Math.min(5, value)));
  await nextTick();
  if (value === "fit") centerSheet();
  else {
    const stageBox = viewport.getBoundingClientRect();
    viewX.value = point.x - stageBox.left - localX * scale.value;
    viewY.value = point.y - stageBox.top - localY * scale.value;
  }
  zooming = false;
}

function wheelZoom(event: WheelEvent) {
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.value!.clientHeight : 1);
  void setZoom(scale.value * Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.003), { x: event.clientX, y: event.clientY });
}

/** Chrome's pointermove often stays at 0 or 0.5 while pointerrawupdate still has the pen pressure. */
let rawPen: { pressure: number; at: number } | undefined;
let penContact = false;

function rememberPen(event: PointerEvent) {
  if (event.pointerType !== "pen" && event.pointerType !== "touch") return;
  rawPen = { pressure: event.pressure, at: event.timeStamp };
}

function onRawPointer(event: Event) {
  rememberPen(event as PointerEvent);
}

/** Firefox on Windows can leave PointerEvent.pressure at 0 while this still has the pen reading. */
function firefoxPressure(event: PointerEvent): number | undefined {
  if (event.pointerType !== "pen" && event.pointerType !== "touch") return;
  const extra = (event as PointerEvent & { mozPressure?: number }).mozPressure;
  if (typeof extra !== "number" || extra <= 0 || extra > 1 || extra === 0.5) return;
  return extra;
}

/** A mouse reports 0.5 while its button is held. Anything else is real pressure, even if the tablet was labeled a mouse. */
function pressureOf(sample: PointerEvent, source: PointerEvent): number {
  const reported = sample.pressure > 0 ? sample.pressure : source.pressure;
  const pen = sample.pointerType === "pen" || sample.pointerType === "touch" || source.pointerType === "pen" || source.pointerType === "touch";
  const flat = reported === 0 || reported === 0.5;
  const raw = rawPen && source.timeStamp - rawPen.at < 40 ? rawPen.pressure : undefined;
  const moz = firefoxPressure(sample) ?? firefoxPressure(source);
  const value = raw !== undefined && flat && raw > 0 && raw !== 0.5 ? raw : moz !== undefined && flat ? moz : reported;
  if (pen || !flat || value !== reported) return Math.max(0, Math.min(1, value));
  return 1;
}

function coordinates(event: PointerEvent, source = event): StrokePoint {
  const rect = canvas.value!.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(CANVAS_WIDTH, (event.clientX - rect.left) * CANVAS_WIDTH / rect.width)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT, (event.clientY - rect.top) * CANVAS_HEIGHT / rect.height)),
    pressure: pressureOf(event, source),
    time: Math.max(active?.stroke.points.at(-1)?.time ?? 0, Math.round(event.timeStamp - (active?.started ?? event.timeStamp))),
  };
}

function overSheet(event: PointerEvent): boolean {
  const rect = canvas.value!.getBoundingClientRect();
  return event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom;
}

function hover(event: PointerEvent) {
  if (locked.value || panMode.value || picking.value || !overSheet(event)) {
    cursor.value = null;
    return;
  }
  const point = coordinates(event);
  cursor.value = { x: point.x * scale.value, y: point.y * scale.value };
}

function startStroke(event: PointerEvent) {
  if (event.pointerType === "mouse" && penContact) return;
  if (event.type === "pointerdown" && (panMode.value || event.button === 1) && !active && !pan && event.isPrimary) {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    releaseFit();
    stage.value!.setPointerCapture(event.pointerId);
    pan = { pointer: event.pointerId, x: event.clientX, y: event.clientY, viewX: viewX.value, viewY: viewY.value };
    panning.value = true;
    cursor.value = null;
    return;
  }
  if (picking.value && !locked.value && event.isPrimary && event.button === 0) {
    event.preventDefault();
    if (overSheet(event) && ready.value && !restoring.value) {
      const picked = readCanvasColor(event);
      if (picked) color.value = picked;
      picking.value = false;
    }
    return;
  }
  if (panMode.value || pan || zooming || !overSheet(event)) return;
  if (!practicing.value || locked.value || discarding.value) return;
  const penLike = event.pointerType === "pen" || event.pointerType === "touch";
  if (!ready.value || restoring.value || submitting.value || submissionPending.value || blocked.value || rejectedKey.value || finishing.value || active || (event.type === "pointerdown" ? event.button !== 0 : event.buttons !== 1) || (!penLike && !event.isPrimary)) return;
  event.preventDefault();
  stage.value!.setPointerCapture(event.pointerId);
  active = {
    pointer: event.pointerId, started: event.timeStamp, timestamp: Date.now(),
    stroke: { renderer: RENDERER, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, tool: tool.value, color: color.value,
      size: size.value, opacity: opacity.value / 100, points: [] },
  };
  drawing.value = true;
  renderer!.begin(active.stroke);
  appendPoint(event);
  if (!startedAt.value) void armClock();
}

function appendPoint(event: PointerEvent, source = event) {
  if (!active) return;
  const point = coordinates(event, source);
  active.stroke.points.push(point);
  renderer!.point(point);
}

function moveStroke(event: PointerEvent) {
  hover(event);
  if (!active || active.pointer !== event.pointerId) return;
  event.preventDefault();
  const samples = event.getCoalescedEvents?.() ?? [];
  for (const sample of samples.length ? samples : [event]) {
    if (!active) break;
    appendPoint(sample, event);
    if (active.stroke.points.length >= MAX_POINTS) {
      // Complete this bounded record; the next move continues the same held gesture.
      void endStroke();
      break;
    }
  }
}

function captureStroke(event: PointerEvent) {
  if (event.pointerType === "pen" || event.pointerType === "touch") {
    if (event.type === "pointerdown") penContact = true;
    if (event.type === "pointerup" || event.type === "pointercancel") penContact = false;
  }
  if (!stage.value || !canvas.value) return;
  const onStage = event.target instanceof Node && stage.value.contains(event.target);
  const over = onStage || overSheet(event);
  if (event.type === "pointerdown" && event.button === 0 && over && event.cancelable) event.preventDefault();
  if ((event.pointerType !== "pen" && event.pointerType !== "touch") || onStage || (!over && event.type === "pointerdown")) return;
  if (event.type === "pointerdown") startStroke(event);
  else if (event.type === "pointermove") continueStroke(event);
  else if (event.type === "pointerup" || event.type === "pointercancel") void endStroke(event);
}

function continueStroke(event: PointerEvent) {
  if (pan) {
    if (pan.pointer === event.pointerId) {
      event.preventDefault();
      viewX.value = pan.viewX + (event.clientX - pan.x);
      viewY.value = pan.viewY + (event.clientY - pan.y);
    }
    return;
  }
  if (picking.value || panMode.value) return;
  if (!active && !finishing.value && event.buttons === 1 && stage.value?.hasPointerCapture(event.pointerId)) startStroke(event);
  moveStroke(event);
}

async function endStroke(event?: PointerEvent) {
  if (pan && event?.pointerId === pan.pointer) {
    pan = undefined;
    panning.value = false;
    return;
  }
  if (!active || (event && active.pointer !== event.pointerId)) return;
  const completed = active;
  // Preserve the last real position without recording pointer-up's artificial zero pressure.
  if (event?.type === "pointerup" && completed.stroke.points.length < MAX_POINTS) {
    const point = coordinates(event);
    point.pressure = completed.stroke.points.at(-1)!.pressure;
    completed.stroke.points.push(point);
    renderer!.point(point);
  }
  active = undefined;
  drawing.value = false;
  finishing.value = true;
  // Queue immediately, so leaving during the final render still warns about unsaved work.
  storage.enqueue(completed.stroke, completed.timestamp);
  finishPromise = renderer!.finish();
  await finishPromise;
  finishing.value = false;
}

async function retry() {
  if (submissionPending.value) await submitDrawing();
  else if (!ready.value) ready.value = await storage.load();
  else await storage.flush();
}

async function submitDrawing() {
  if (!practicing.value || drawing.value || finishing.value || restoring.value || discarding.value || !ready.value || !renderer) return;
  await finishPromise;
  const index = await storage.submit(() => renderer!.exportWebp());
  if (index !== null) {
    cursor.value = null;
    panMode.value = false;
    await loadSession();
    await setZoom("fit");
  }
}

function applySession(result: { practicing: boolean; source: string; credit: string; started: boolean; startedAt: number }) {
  practicing.value = result.practicing;
  reference.value = result.practicing ? { source: result.source, credit: result.credit } : null;
  startedAt.value = result.practicing && result.started ? result.startedAt : 0;
}

async function loadSession() {
  sessionError.value = "";
  try {
    const result = await api.practice.current();
    if (disposed) return;
    if ("error" in result) {
      sessionError.value = result.error === "UNAUTHORIZED" ? "Your session ended. Sign in again." : "Could not load your practice.";
      practicing.value = false;
      return;
    }
    applySession(result);
    sessionReady.value = true;
  } catch {
    if (!disposed) sessionError.value = "Could not load your practice.";
  }
}

async function choose(fundamental: string) {
  chooseError.value = "";
  choosing.value = fundamental;
  try {
    const result = await api.practice.begin({ fundamental });
    if (disposed) return;
    if ("error" in result) {
      chooseError.value = result.error === "INVALID_REQUEST"
        ? "No reference is available for that fundamental today."
        : result.error === "UNAUTHORIZED" ? "Your session ended. Sign in again." : "Could not start this practice. Try again.";
      return;
    }
    applySession({ practicing: true, source: result.source, credit: result.credit, started: result.started, startedAt: result.startedAt });
  } catch {
    if (!disposed) chooseError.value = "Could not start this practice. Try again.";
  } finally { choosing.value = ""; }
}

async function armClock() {
  if (arming || startedAt.value || !practicing.value) return;
  arming = true;
  try {
    const result = await api.practice.start();
    if (!disposed && !("error" in result)) startedAt.value = result.startedAt;
  } finally { arming = false; }
}

async function discardDrawing() {
  if (!practicing.value || drawing.value || finishing.value || discarding.value) return;
  if (!window.confirm("Discard this drawing? It will not be saved.")) return;
  discarding.value = true;
  try {
    const cleared = await abandon();
    if (cleared) {
      cursor.value = null;
      panMode.value = false;
      picking.value = false;
      await loadSession();
    }
  } finally { discarding.value = false; }
}

function reviseHistory(kind: "undo" | "redo") {
  if (locked.value || !ready.value || drawing.value || finishing.value || restoring.value || panning.value) return;
  if (kind === "undo" ? !canUndo.value : !canRedo.value) return;
  picking.value = false;
  void (kind === "undo" ? storage.undo() : storage.redo());
}

function keydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    picking.value = false;
    return;
  }
  if (locked.value || !practicing.value) return;
  const typing = event.target instanceof HTMLElement && event.target.matches("input, select, textarea, [contenteditable]");
  if (!typing && !event.altKey && !event.shiftKey && (event.ctrlKey || event.metaKey)) {
    const key = event.key.toLowerCase();
    if (key === "z" || key === "y") {
      event.preventDefault();
      if (drawing.value || finishing.value || restoring.value || panning.value) return;
      reviseHistory(key === "z" ? "undo" : "redo");
      return;
    }
  }
  if (event.ctrlKey || event.metaKey || event.altKey || typing) return;
  const next = tools.find((entry) => entry.key.toLowerCase() === event.key.toLowerCase());
  if (next) chooseTool(next.id);
  if (event.key.toLowerCase() === "c") togglePick();
  if (event.key === "[") size.value = Math.max(1, size.value - 2);
  if (event.key === "]") size.value = Math.min(100, size.value + 2);
  if (event.key === "ArrowDown") { event.preventDefault(); opacity.value = Math.max(1, opacity.value - 2); }
  if (event.key === "ArrowUp") { event.preventDefault(); opacity.value = Math.min(100, opacity.value + 2); }
}

onMounted(async () => {
  await nextTick();
  if (disposed) return;
  renderer = new StrokeRenderer(canvas.value!);
  renderer.track();
  resize = new ResizeObserver(([entry]) => {
    const { width, height } = entry!.contentRect;
    fitScale.value = Math.max(0.1, Math.min((width - 48) / CANVAS_WIDTH, (height - 48) / CANVAS_HEIGHT, 1));
    if (zoom.value === "fit") centerSheet();
  });
  resize.observe(stage.value!);
  document.documentElement.style.touchAction = "none";
  document.body.style.touchAction = "none";
  window.addEventListener("pointerrawupdate", onRawPointer);
  window.addEventListener("pointerdown", captureStroke, { capture: true });
  window.addEventListener("pointermove", captureStroke, { capture: true });
  window.addEventListener("pointerup", captureStroke, { capture: true });
  window.addEventListener("pointercancel", captureStroke, { capture: true });
  window.addEventListener("keydown", keydown);
  clockTimer = window.setInterval(() => { ticking.value = Date.now(); }, 200);
  const loaded = await storage.load();
  if (!disposed) ready.value = loaded;
  await loadSession();
});

onBeforeUnmount(() => {
  disposed = true;
  if (clockTimer !== undefined) window.clearInterval(clockTimer);
  resize?.disconnect();
  document.documentElement.style.touchAction = "";
  document.body.style.touchAction = "";
  window.removeEventListener("pointerrawupdate", onRawPointer);
  window.removeEventListener("pointerdown", captureStroke, { capture: true });
  window.removeEventListener("pointermove", captureStroke, { capture: true });
  window.removeEventListener("pointerup", captureStroke, { capture: true });
  window.removeEventListener("pointercancel", captureStroke, { capture: true });
  renderer?.dispose();
  window.removeEventListener("keydown", keydown);
});
</script>

<template>
  <main class="studio">
    <div class="sheet" :class="{ veiled: !practicing }">
    <aside class="tools-panel" :class="{ locked }" aria-label="Drawing tools">
      <div class="history-actions" role="group" aria-label="Undo and redo">
        <button type="button" class="history" title="Undo (Ctrl+Z)" :disabled="locked || !canUndo || !ready || drawing || finishing || restoring || panning" @click="reviseHistory('undo')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H12" /></svg>
          <span class="tool-label">Undo</span>
        </button>
        <button type="button" class="history" title="Redo (Ctrl+Y)" :disabled="locked || !canRedo || !ready || drawing || finishing || restoring || panning" @click="reviseHistory('redo')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H12" /></svg>
          <span class="tool-label">Redo</span>
        </button>
      </div>
      <div class="tool-list" role="group" aria-label="Choose a drawing tool">
        <button v-for="entry in tools" :key="entry.id" class="tool" :class="{ selected: tool === entry.id }" :aria-pressed="tool === entry.id" :title="`${entry.name} (${entry.key})`" :disabled="locked" @click="chooseTool(entry.id)">
          <span class="tool-icon"><ToolIcon :tool="entry.id" /></span>
          <span class="tool-label">{{ entry.name }}</span><kbd>{{ entry.key }}</kbd>
        </button>
      </div>

      <section class="settings" aria-label="Brush settings">
        <div class="setting-title"><label for="brush-size">Size</label><output for="brush-size">{{ size }} <span>px</span><span class="hotkeys" aria-hidden="true"><kbd>[</kbd><span>/</span><kbd>]</kbd></span></output></div>
        <input id="brush-size" v-model.number="size" type="range" min="1" max="100" :disabled="locked" :style="{ '--range': `${size}%` }" />
        <div class="setting-title opacity-title"><label for="brush-opacity">Opacity</label><output for="brush-opacity">{{ opacity }}<span>%</span><span class="hotkeys" aria-hidden="true"><kbd>↓</kbd><span>/</span><kbd>↑</kbd></span></output></div>
        <input id="brush-opacity" v-model.number="opacity" type="range" min="1" max="100" :disabled="locked" :style="{ '--range': `${opacity}%` }" />
      </section>

      <section class="color-section" aria-label="Ink color" :class="{ inactive: tool === 'eraser' }">
        <div class="color-row">
          <label class="color-picker" for="ink-color"><input id="ink-color" v-model="color" type="color" :disabled="locked || tool === 'eraser'" @input="picking = false" /><span>{{ color.toUpperCase() }}</span></label>
          <button type="button" class="eyedropper" :aria-pressed="picking" aria-label="Pick a color from the canvas (C)" title="Pick a color from the canvas (C)" :disabled="locked || tool === 'eraser' || !ready || restoring || drawing || panning" @click="togglePick"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M76.45 45.5C78.88 47.93 80.88 53.72 75.5 54.08C73.17 54.24 72.47 52.62 70.5 52.02C61.93 60 46.47 78 36.97 82.8C33.68 84.47 30.16 84.11 26.82 85.26C18.78 88.05 17.46 97.1 9.27 85.91C5.95 81.38 13.39 77.25 14.82 73.31C16.03 69.96 15.63 66.3 17.16 62.98C20.55 55.66 28.66 49.69 34.36 44.19C36.97 41.67 48.27 32.29 48.67 29.5C42.46 23.87 48.38 17.56 54.5 23.55C60.78 19.76 64.16 11.75 71.37 9.2C83.16 5.04 95.03 16.78 90.79 28.61C88.21 35.82 80.3 39.24 76.45 45.5ZM54.5 36.24C48.3 43.09 41.23 49.33 34.57 55.73C31.41 58.76 27.39 61.85 25.19 65.69C23.82 68.1 23.79 70.81 23.25 73.48C22.92 75.12 21.4 77.56 21.5 78.97C23.19 78.72 24.62 77.61 26.27 77.14C28.21 76.6 30.4 76.56 32.28 75.8C39.69 72.78 48.21 61.91 54.11 56.27C57.37 53.15 62.6 49.53 64.6 45.5C61.24 42.41 57.87 39.33 54.5 36.24Z" fill="currentColor" fill-rule="evenodd" stroke="currentColor" stroke-width="0.25" stroke-linejoin="round" /></svg><kbd>C</kbd></button>
        </div>
        <div class="swatches" role="group" aria-label="Color palette">
          <button v-for="swatch in palette" :key="swatch" :style="{ background: swatch }" :class="{ chosen: color === swatch }" :aria-label="`Use color ${swatch}`" :aria-pressed="color === swatch" :disabled="locked || tool === 'eraser'" @click="color = swatch; picking = false"><span v-if="color === swatch" :style="{ color: swatch === '#ffffff' ? '#252b25' : '#fff' }">✓</span></button>
        </div>
      </section>
    </aside>

    <section class="workspace" aria-label="Drawing workspace">
      <div v-if="error" class="save-error" role="alert"><span>{{ error }} <template v-if="pending.length">{{ pending.length }} stroke{{ pending.length === 1 ? '' : 's' }} waiting.</template></span>
        <button v-if="rejectedKey" :disabled="saving || drawing || finishing || restoring" @click="storage.discardRejected">Discard rejected stroke</button>
        <button v-else-if="!blocked" :disabled="submitting || saving" @click="retry">{{ submissionPending ? 'Retry submission' : 'Retry' }}</button>
      </div>
      <div class="stage-frame">
      <div class="canvas-toolbar">
        <div class="zoom-control" role="group" aria-label="Canvas view controls">
          <button aria-label="Zoom out canvas" title="Zoom out canvas" :disabled="drawing || panning || scale <= 0.1" @click="setZoom(scale / 1.25)">−</button>
          <output aria-label="Canvas zoom">{{ Math.round(scale * 100) }}%</output>
          <button aria-label="Zoom in canvas" title="Zoom in canvas" :disabled="drawing || panning || scale >= 5" @click="setZoom(scale * 1.25)">+</button>
          <button :disabled="drawing || panning" title="Fit canvas to screen" @click="setZoom('fit')">Fit</button>
          <button :aria-pressed="panMode" :disabled="drawing || panning" title="Drag to move around the canvas" @click="panMode = !panMode; picking = false; cursor = null">Pan</button>
        </div>
      </div>
      <div ref="stage" class="canvas-stage" :class="{ 'pan-mode': panMode, panning, picking, locked }" @wheel.prevent="wheelZoom" @pointerdown="startStroke" @pointermove="continueStroke" @pointerup="endStroke" @pointercancel="endStroke" @lostpointercapture="endStroke" @pointerleave="cursor = null">
        <div class="canvas-position" :style="{ width: `${CANVAS_WIDTH * scale}px`, height: `${CANVAS_HEIGHT * scale}px`, transform: `translate(${viewX}px, ${viewY}px)` }">
          <canvas ref="canvas" class="drawing-canvas" :class="{ unavailable: !ready || restoring }" aria-label="Drawing canvas. Use a mouse, touch, or pressure-sensitive pen to draw." @contextmenu.prevent />
          <div v-if="cursor && ready && !restoring" class="brush-cursor" :style="{ left: `${cursor.x}px`, top: `${cursor.y}px`, width: `${Math.max(4, size * scale)}px`, height: `${Math.max(4, size * scale)}px` }" />
          <div v-if="loading || restoring" class="canvas-loading" role="status">Restoring your canvas…</div>
          <div v-else-if="!ready" class="canvas-loading">Your canvas will appear when it can be loaded.</div>
        </div>
      </div>
      </div>
      <div class="submission-bar">
        <p>{{ locked ? "Time is up. Save this artwork, or discard it." : "Keep it up! You can discard or complete your drawing early." }}</p>
        <div>
          <button type="button" :disabled="!practicing || discarding || drawing || finishing || submitting || saving || restoring" @click="discardDrawing">{{ discarding ? "Discarding…" : "Discard" }}</button>
          <button class="submit" type="button" :disabled="!practicing || !ready || !saved || pending.length > 0 || saving || submitting || drawing || finishing || restoring || blocked || discarding" @click="submitDrawing">{{ submitting ? "Saving…" : submissionPending ? "Retry save" : "Save artwork" }}</button>
        </div>
      </div>
    </section>

    <ReferencePanel v-if="reference" :src="reference.source" :alt="reference.credit" :caption="reference.credit" />

    <footer class="studio-footer">
      <div class="save-status" role="status" aria-live="polite">
        <span class="status-dot" :class="{ waiting: saving || loading || restoring, failed: !!error }" />
        <span class="status-label"><span>{{ status }}</span><span class="status-sizer" aria-hidden="true">Submitting artwork…</span><span class="status-sizer" aria-hidden="true">Restoring canvas…</span><span class="status-sizer" aria-hidden="true">Saving artwork…</span></span>
      </div>
      
    </footer>
    </div>
    <p v-if="practicing" class="clock" :class="{ done: locked }" role="timer" aria-label="Time remaining">{{ clockLabel }}</p>
    <section v-else class="chooser" :aria-busy="!sessionReady && !sessionError" aria-labelledby="practice-choice-title">
      <div class="chooser-card">
        <h2 id="practice-choice-title">Choose a fundamental</h2>
        <p>Today's reference for that fundamental is shown beside the canvas. The 15-minute timer starts when you make the first stroke.</p>
        <div class="choices">
          <button v-for="item in FUNDAMENTALS" :key="item" type="button" :disabled="!sessionReady || choosing !== ''" @click="choose(item)">{{ choosing === item ? "Starting…" : label(item) }}</button>
        </div>
        <p v-if="sessionError" class="error" role="alert">{{ sessionError }}</p>
        <button v-if="sessionError" type="button" @click="loadSession">Retry</button>
        <p v-if="chooseError" class="error" role="alert">{{ chooseError }}</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.studio { --ink: #27372d; --muted: #70776e; --line: #dfe2d8; --accent: #465a3d; position: relative; display: flex; flex-direction: column; flex: 1; min-height: 0; color: var(--ink); background: #f8f9f4; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; font-size: 13px; }
.sheet { display: grid; grid-template: minmax(0, 1fr) 38px / 248px minmax(0, 1fr); flex: 1; min-height: 0; }
.sheet.veiled { filter: blur(7px); pointer-events: none; user-select: none; }
.tools-panel.locked { opacity: .45; }
.canvas-stage.locked .drawing-canvas { cursor: default; }
.clock { position: fixed; z-index: 30; top: 74px; left: 50%; transform: translateX(-50%); margin: 0; padding: 8px 18px; background: #fcfcf8; border: 1px solid var(--line); border-radius: 999px; font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: .04em; pointer-events: none; }
.clock.done { color: #8a3d3d; }
.chooser { position: absolute; inset: 0; z-index: 7; display: grid; place-items: center; padding: 24px; }
.chooser-card { width: min(100%, 420px); display: flex; flex-direction: column; gap: 14px; padding: 28px; background: white; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 12px 40px rgba(39, 55, 45, 0.12); }
.chooser-card h2 { margin: 0; font-size: 1.35rem; }
.chooser-card p { margin: 0; color: var(--muted); line-height: 1.45; }
.chooser-card .error { color: #8a3d3d; }
.choices { display: grid; gap: 8px; }
.choices button { min-height: 44px; text-align: left; padding: 10px 14px; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: var(--ink); }
.choices button:hover:not(:disabled) { background: #f0f2e9; }
button, select, input { font: inherit; }
button, select { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .45; }
button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid #567b8a; outline-offset: 4px; }
.tools-panel { display: flex; flex-direction: column; border-right: 1px solid var(--line); padding: 8px 20px 20px; overflow: auto; background: #fcfcf8; }
.history-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 14px; }
.history { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; border: 1px solid transparent; border-radius: 8px; padding: 10px 6px; background: transparent; color: var(--ink); }
.history:hover:not(:disabled) { background: #f0f2e9; }
.history svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.tool-list { display: grid; gap: 7px; }
.tool { display: flex; align-items: center; gap: 11px; border: 1px solid transparent; border-radius: 8px; padding: 12px 9px; background: transparent; color: var(--ink); text-align: left; width: 100%; }
.tool:hover { background: #f0f2e9; }
.tool.selected { background: #e9eddf; border-color: #d5dcc7; }
.tool-icon { width: 24px; flex-shrink: 0; }
.tool-icon svg { display: block; width: 24px; height: 24px; }
.tool-label { font-weight: 600; font-size: 12px; }
.tool kbd { margin-left: auto; font-family: monospace; font-size: 13px; color: #8b9280; }
.settings { border-top: 1px solid var(--line); margin-top: 23px; padding: 23px 4px; }
.setting-title { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
output { display: flex; align-items: center; color: var(--ink); font-variant-numeric: tabular-nums; }
output > span { color: var(--muted); font-size: 10px; }
.hotkeys { display: inline-flex; align-items: center; gap: 5px; margin-left: 9.6px; }
.hotkeys kbd, .hotkeys span { font-family: monospace; font-size: 13px; line-height: 1; color: #8b9280; }
.opacity-title { margin-top: 22px; }
input[type="range"] { width: 100%; height: 4px; appearance: none; background: linear-gradient(to right, #63764e var(--range), #e0e4d8 var(--range)); margin: 17px 0 4px; border-radius: 4px; cursor: pointer; }
input[type="range"]::-webkit-slider-thumb { appearance: none; width: 13px; height: 13px; background: #465a3d; border: 2px solid #fcfcf8; border-radius: 50%; box-shadow: 0 0 0 1px #465a3d; }
input[type="range"]::-moz-range-thumb { width: 10px; height: 10px; background: #465a3d; border: 2px solid #fcfcf8; border-radius: 50%; }
.color-section { border-top: 1px solid var(--line); padding: 22px 4px 24px; }
.color-section.inactive { opacity: .45; }
.color-row { display: flex; align-items: center; gap: 8px; }
.color-picker { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 11px; }
.eyedropper { margin-left: auto; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0 7px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--muted); }
.eyedropper svg { display: block; width: 15.9px; height: 15.9px; fill: currentColor; stroke: none; }
.eyedropper kbd { font-family: monospace; font-size: 13px; line-height: 1; color: #8b9280; }
.eyedropper:hover:not(:disabled) { background: #f0f2e9; color: var(--ink); }
.eyedropper[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: white; }
.eyedropper[aria-pressed="true"] kbd { color: white; }
input[type="color"] { appearance: none; border: 1px solid #d1d6c8; border-radius: 7px; padding: 3px; width: 37px; height: 37px; background: white; cursor: pointer; }
input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
input[type="color"]::-webkit-color-swatch { border: 0; border-radius: 3px; }
.swatches { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-top: 18px; }
.swatches button { width: 20px; height: 20px; border-radius: 50%; padding: 0; border: 1px solid #00000015; display: grid; place-items: center; font-size: 11px; }
.swatches button.chosen { outline: 1px solid #879176; outline-offset: 3px; }
.privacy { display: flex; align-items: center; gap: 7px; }
.privacy svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.3; }
.workspace { display: flex; flex-direction: column; min-height: 0; min-width: 0; background: #e9ece3; }
.stage-frame { position: relative; flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.canvas-toolbar { position: absolute; z-index: 2; top: 0; right: 0; display: flex; justify-content: flex-end; padding: 16px 24px 0; background: transparent; pointer-events: none; }
.zoom-control { display: flex; gap: 5px; align-items: center; color: var(--muted); font-size: 11px; pointer-events: auto; }
.zoom-control button { min-width: 36px; min-height: 36px; background: #f5f6ef; border: 1px solid #d9dece; padding: 7px 10px; border-radius: 6px; color: var(--ink); }
.zoom-control button:hover { background: #e0e6d5; }
.zoom-control button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: white; }
.zoom-control output { width: 42px; justify-content: center; text-align: center; }
.canvas-stage { position: relative; flex: 1; min-width: 0; min-height: 0; overflow: hidden; touch-action: none; }
.canvas-stage.pan-mode { cursor: grab; }
.canvas-stage.panning { cursor: grabbing; }
.canvas-position { position: absolute; left: 0; top: 0; background: white; box-shadow: 0 2px 4px #25301d08, 0 12px 35px #25301d12; touch-action: none; }
.drawing-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: none; }
.drawing-canvas.unavailable { cursor: wait; }
.pan-mode .drawing-canvas { cursor: grab; }
.panning .drawing-canvas { cursor: grabbing; }
.canvas-stage.picking, .canvas-stage.picking .drawing-canvas { cursor: crosshair; }
.brush-cursor { position: absolute; transform: translate(-50%, -50%); border: 1px solid #555; box-shadow: 0 0 0 1px #fff9; border-radius: 50%; pointer-events: none; }
.canvas-loading { position: absolute; inset: 0; display: grid; place-content: center; padding: 20px; background: #ffffffd9; color: var(--muted); text-align: center; }
.submission-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid #d5dcc7; background: #f5f6ef; }
.submission-bar p { margin: 0; font-size: 11px; color: var(--muted); line-height: 1.5; }
.submission-bar > div { display: flex; flex-wrap: wrap; gap: 8px; }
.submission-bar button { min-height: 44px; padding: 9px 12px; border: 1px solid #cbd2c1; border-radius: 7px; background: white; color: var(--ink); font-size: 11px; }
.submission-bar .submit { background: var(--accent); color: white; border-color: var(--accent); }
.save-status { display: flex; align-items: center; gap: 7px; font-size: 10px; color: var(--muted); }
.status-label { display: grid; }
.status-label > span { grid-area: 1 / 1; white-space: nowrap; }
.status-sizer { visibility: hidden; }
.status-dot { width: 5px; height: 5px; border-radius: 50%; background: #6f8655; }
.status-dot.waiting { background: #b49b47; }
.status-dot.failed { background: #b14e3e; }
.save-error { position: relative; z-index: 21; display: flex; gap: 16px; justify-content: space-between; align-items: center; margin: 8px 24px 0; padding: 10px 14px; background: #fff2dc; color: #754420; border: 1px solid #e2c7a2; border-radius: 6px; font-size: 12px; }
.save-error button { border: 1px solid #b29d7e; padding: 5px 13px; color: inherit; border-radius: 4px; background: #fff9ef; }
.studio-footer { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; color: var(--muted); border-top: 1px solid var(--line); background: #fcfcf8; font-size: 10px; }
@media (max-width: 760px) { .zoom-control button { min-width: 44px; min-height: 44px; } .eyedropper { min-width: 44px; height: 44px; } }
@media (max-height: 780px) and (min-width: 761px) { .tool { padding-top: 9px; padding-bottom: 9px; } .settings { margin-top: 17px; padding-top: 18px; padding-bottom: 18px; } }
@media (max-width: 1000px) { .sheet { grid-template-columns: 218px minmax(0, 1fr); } .tools-panel { padding-left: 14px; padding-right: 14px; } .tool { gap: 8px; padding-left: 7px; padding-right: 7px; } .canvas-toolbar { padding-right: 16px; } }
@media (max-width: 760px) { .studio, .sheet { flex: none; } .sheet { grid-template: auto minmax(380px, 1fr) 38px / minmax(0, 1fr); } .tools-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; padding: 15px 20px; border-right: 0; border-bottom: 1px solid var(--line); overflow: visible; } .history-actions { grid-column: 1 / -1; margin-bottom: 0; } .tool-list { grid-column: 1 / -1; grid-template-columns: repeat(4, 1fr); gap: 5px; } .tool { flex-direction: column; gap: 5px; padding: 8px 2px; text-align: center; } .tool-icon, .tool-icon svg { width: 20px; height: 20px; } .tool-label { font-size: 10px; } .tool kbd { display: none; } .settings { margin: 0; padding: 0; border: 0; } .opacity-title { margin-top: 13px; } .setting-title { font-size: 10px; } input[type="range"] { margin-top: 12px; } .color-section { padding: 0; border: 0; } .color-picker { margin-top: 0; } .swatches { gap: 5px; margin-top: 10px; } .swatches button { width: 17px; height: 17px; } .canvas-toolbar { padding: 12px 16px 0; } .zoom-control > span { display: none; } .workspace { min-height: 390px; height: calc(100dvh - 360px); } .studio-footer { grid-row: 3; padding: 0 16px; } }
</style>
