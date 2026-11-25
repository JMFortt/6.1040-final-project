import { Brush } from "easy-brush";
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Stroke, type StrokePoint, type Tool } from "../../src/drawing/stroke.ts";

function surface(width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  // Use the same CPU raster path as Easy-Brush's internal canvases. Mixing GPU
  // and CPU surfaces can round translucent texture pixels differently on reload.
  canvas.getContext("2d", { willReadFrequently: true });
  return canvas;
}

const tips = new Map<Tool, { pixels: ImageData; alpha: number }>();
const colors = new Map<string, [number, number, number]>();
const coloredTips = new Map<string, HTMLCanvasElement>();
const scaledTips = new Map<string, { canvas: HTMLCanvasElement; size: number }>();

function remember<K, V>(map: Map<K, V>, key: K, value: V, limit: number) {
  if (map.size >= limit) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
  map.set(key, value);
  return value;
}

/** CSS color to channels. Easy-Brush tints the tip with source-atop, which keeps the mask alpha. */
function channels(color: string): [number, number, number] {
  const cached = colors.get(color);
  if (cached) return cached;
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.fillStyle = "#000000";
  probe.fillStyle = color;
  const match = /^#([\da-f]{6})$/i.exec(probe.fillStyle);
  const rgb: [number, number, number] = match
    ? [Number.parseInt(match[1]!.slice(0, 2), 16), Number.parseInt(match[1]!.slice(2, 4), 16), Number.parseInt(match[1]!.slice(4, 6), 16)]
    : [0, 0, 0];
  colors.set(color, rgb);
  return rgb;
}

function coloredTip(tool: Tool, color: string) {
  const key = `${tool}\0${color}`;
  const hit = coloredTips.get(key);
  if (hit) {
    coloredTips.delete(key);
    coloredTips.set(key, hit);
    return hit;
  }
  const mask = tip(tool).pixels;
  const canvas = surface(96, 96);
  const image = new ImageData(new Uint8ClampedArray(mask.data), 96, 96);
  const [red, green, blue] = channels(color);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    data[index] = red;
    data[index + 1] = green;
    data[index + 2] = blue;
  }
  canvas.getContext("2d")!.putImageData(image, 0, 0);
  return remember(coloredTips, key, canvas, 32);
}

/** One scaled tip per quarter pixel, so a long replay blits instead of resampling the 96px mask. */
function scaledTip(tool: Tool, color: string, diameter: number) {
  const size = Math.max(0.5, Math.round(diameter * 4) / 4);
  const key = `${tool}\0${color}\0${size}`;
  const hit = scaledTips.get(key);
  if (hit) {
    scaledTips.delete(key);
    scaledTips.set(key, hit);
    return hit;
  }
  const pixels = Math.max(1, Math.ceil(size));
  const canvas = surface(pixels, pixels);
  canvas.getContext("2d")!.drawImage(coloredTip(tool, color), 0, 0, size, size);
  return remember(scaledTips, key, { canvas, size }, 256);
}

/** Cache pristine pixels: Easy-Brush recolors the canvas passed to loadImage. */
function tip(tool: Tool) {
  const cached = tips.get(tool);
  if (cached) return cached;
  const canvas = surface(96, 96);
  const ctx = canvas.getContext("2d")!;
  if (tool === "ink" || tool === "eraser") {
    ctx.beginPath();
    ctx.arc(48, 48, 47, 0, Math.PI * 2);
    ctx.fill();
  } else {
    let seed = tool === "graphite" ? 7391 : 1327;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const count = tool === "graphite" ? 1400 : 180;
    for (let i = 0; i < count; i++) {
      const x = random() * 96;
      const y = random() * 96;
      const distance = Math.hypot(x - 48, y - 48) / 48;
      if (distance > 1) continue;
      ctx.globalAlpha = (1 - distance * 0.6) * (0.2 + random() * 0.8);
      ctx.fillRect(x, y, tool === "graphite" ? 1.5 : 2, tool === "graphite" ? 1.5 : 5 + random() * 9);
    }
  }
  const generated = { pixels: ctx.getImageData(0, 0, 96, 96), alpha: ctx.globalAlpha };
  tips.set(tool, generated);
  return generated;
}

/** Easy-Brush renders one transparent stroke; we composite it onto the retained image.
 * This also avoids 0.5.0's endStroke source-over merge resurrecting erased pixels. */
export class StrokeRenderer {
  private readonly base = surface();
  private readonly layer = surface();
  private readonly shape = surface(96, 96);
  private readonly brush = new Brush();
  private frame = 0;
  private active: Stroke | null = null;
  private disposed = false;
  private paused = false;
  /** Recent full canvases, newest last, so undo and redo can swap the picture without replaying every stroke. */
  private frames: HTMLCanvasElement[] = [];
  private undone: HTMLCanvasElement[] = [];
  private omitted = 0;
  private tracking = false;
  private readonly kept = 24;
  /** Previous sample, so a held pen can thicken in place and a fast move stays filled. */
  private lastSample: { x: number; y: number; pressure: number } | null = null;
  /** Timelapse stamps onto the layer directly. Easy-Brush mixes a full canvas whenever its queue empties. */
  private replaying = false;
  private replayColor = "#000000";
  private readonly layerContext = this.layer.getContext("2d")!;
  private readonly baseContext = this.base.getContext("2d")!;

  constructor(private readonly view: HTMLCanvasElement) {
    view.width = CANVAS_WIDTH;
    view.height = CANVAS_HEIGHT;
    view.getContext("2d", { willReadFrequently: true });
    this.brush.maxUndoRedoStackSize = 0;
    this.brush.loadContext(this.layer);
    // Spacing blends the previous pressure into the next one and ignores a pen that has not moved.
    // A hard press then shows up later, as a taper along the tail, instead of under the nib.
    this.brush.isSpacing = false;
    this.brush.isSmooth = false;
    const pace = this.brush as unknown as { lagDistance: number; minSpacePixel: number };
    pace.lagDistance = 0;
    pace.minSpacePixel = 0.15;
    // Bind a fresh object: Easy-Brush 0.5.0's default config is shared across instances.
    this.brush.bindConfig({ color: "#000000", size: 8, flow: 1, opacity: 1, spacing: 0.05, roundness: 1, angle: 0 });
    this.brush.useModule({ onChangeConfig: (config, pressure) => {
      config.size *= Math.max(0.08, Math.max(0, Math.min(1, pressure)));
    } });
  }

  /** Remember each finished stroke so the working canvas can undo without a full restore. */
  track() {
    this.tracking = true;
  }

  begin(stroke: Stroke, options?: { replay?: boolean }) {
    if (options?.replay) {
      if (this.replaying) this.commitReplay();
      this.beginReplay(stroke);
      return;
    }
    if (this.replaying) this.commitReplay();
    this.active = stroke;
    this.lastSample = null;
    this.brush.isSpacing = false;
    this.brush.isSmooth = false;
    this.brush.clear();
    this.brush.loadConfig({
      color: stroke.tool === "eraser" ? "#000000" : stroke.color,
      size: stroke.size, opacity: stroke.opacity,
      flow: stroke.tool === "graphite" ? 0.3 : stroke.tool === "dry-brush" ? 0.75 : 1,
      spacing: stroke.tool === "graphite" ? 0.035 : 0.05,
    });
    const mask = tip(stroke.tool);
    const context = this.shape.getContext("2d")!;
    context.putImageData(mask.pixels, 0, 0);
    // The tip is black pixels with their own alpha. Recoloring uses this same context,
    // and a leftover partial alpha would mix the chosen color back into that black.
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    this.brush.loadImage(this.shape);
    (this.brush as Brush & { _stampColor?: string })._stampColor = "";
    this.animate();
  }

  point(point: StrokePoint, defer = false) {
    const stamp = this.replaying
      ? (x: number, y: number, pressure: number) => this.blot(x, y, pressure)
      : (x: number, y: number, pressure: number) => this.brush.putPoint(x, y, pressure);
    this.walk(point, stamp);
    if (!this.replaying && !defer) this.brush.render();
  }

  /** Fill the gap to the previous sample, then stamp this one. A near-duplicate is dropped. */
  private walk(point: StrokePoint, stamp: (x: number, y: number, pressure: number) => void) {
    const pressure = Math.max(0, Math.min(1, point.pressure));
    const previous = this.lastSample;
    if (previous) {
      const dx = point.x - previous.x;
      const dy = point.y - previous.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.35 && Math.abs(pressure - previous.pressure) < 0.012) return;
      const width = Math.max(1, (this.active?.size ?? 8) * Math.max(0.08, pressure));
      const step = Math.max(0.75, width * 0.3);
      const count = Math.min(48, Math.floor(distance / step));
      for (let i = 1; i <= count; i++) {
        const t = i / (count + 1);
        stamp(previous.x + dx * t, previous.y + dy * t, previous.pressure + (pressure - previous.pressure) * t);
      }
    }
    stamp(point.x, point.y, pressure);
    this.lastSample = { x: point.x, y: point.y, pressure };
  }

  private beginReplay(stroke: Stroke) {
    this.replaying = true;
    this.active = stroke;
    this.lastSample = null;
    this.replayColor = stroke.tool === "eraser" ? "#000000" : stroke.color;
    const flow = stroke.tool === "graphite" ? 0.3 : stroke.tool === "dry-brush" ? 0.75 : 1;
    this.layerContext.globalCompositeOperation = "source-over";
    this.layerContext.globalAlpha = 1;
    this.layerContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.layerContext.globalAlpha = flow;
  }

  private blot(x: number, y: number, pressure: number) {
    const stroke = this.active;
    if (!stroke) return;
    const scale = Math.max(0.08, Math.max(0, Math.min(1, pressure)));
    const stamp = scaledTip(stroke.tool, this.replayColor, stroke.size * scale);
    this.layerContext.drawImage(stamp.canvas, x - stamp.size / 2, y - stamp.size / 2, stamp.size, stamp.size);
  }

  /** Bake the open replay stroke. Flow is already in the layer; opacity applies once, as Easy-Brush does at mix time. */
  private commitReplay() {
    const stroke = this.active;
    this.layerContext.globalAlpha = 1;
    if (stroke) {
      this.baseContext.globalAlpha = stroke.opacity;
      this.baseContext.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
      this.baseContext.drawImage(this.layer, 0, 0);
      this.baseContext.globalAlpha = 1;
      this.baseContext.globalCompositeOperation = "source-over";
    }
    this.layerContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.replaying = false;
    this.active = null;
    this.lastSample = null;
  }

  /** True while queued stamps are being drawn, so a nested screen update does not draw them twice. */
  private flushing = false;

  /**
   * Easy-Brush clears its layer, then draws queued stamps on a later frame.
   * Finish that queue before the screen updates, or a seek flashes a blank stroke.
   */
  private queue() {
    return (this.brush as unknown as { points: unknown[] }).points;
  }

  idle() {
    return this.queue().length === 0;
  }

  /** Draw queued stamps. Stops after maxMs so a long replay can yield to clicks; returns true when the queue is empty. */
  flush(maxMs = Number.POSITIVE_INFINITY) {
    if (this.flushing) return this.queue().length === 0;
    this.flushing = true;
    const start = performance.now();
    try {
      const brush = this.brush as unknown as { points: unknown[]; draw: () => void };
      let guard = 0;
      while (brush.points.length > 0 && guard++ < 200000) {
        brush.draw();
        if (performance.now() - start >= maxMs) break;
      }
    } finally {
      this.flushing = false;
    }
    return this.queue().length === 0;
  }

  /** Drop the stroke in progress without baking it. Used when a snapshot replaces the picture. */
  discardActive() {
    this.active = null;
    this.lastSample = null;
    this.replaying = false;
    this.queue().length = 0;
    this.layerContext.globalAlpha = 1;
    this.layerContext.globalCompositeOperation = "source-over";
    this.layerContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.brush.clear();
  }

  clearPicture() {
    this.discardActive();
    const ctx = this.base.getContext("2d")!;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  replaceBase(source: CanvasImageSource) {
    this.clearPicture();
    this.base.getContext("2d")!.drawImage(source, 0, 0);
  }

  /** A copy of the baked picture, safe to keep after later strokes change the canvas. */
  capture() {
    const copy = surface();
    copy.getContext("2d")!.drawImage(this.base, 0, 0);
    return copy;
  }

  /** Paint once and leave the animation loop stopped. */
  paintFrame() {
    if (this.disposed) return;
    this.paint();
  }

  private paint() {
    this.flush();
    const ctx = this.view.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(this.base, 0, 0);
    if (this.active) {
      ctx.globalAlpha = this.replaying ? this.active.opacity : 1;
      ctx.globalCompositeOperation = this.active.tool === "eraser" ? "destination-out" : "source-over";
      ctx.drawImage(this.layer, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  private animate() {
    cancelAnimationFrame(this.frame);
    if (this.paused || this.disposed) return;
    const tick = () => {
      if (this.disposed || this.paused) return;
      this.paint();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  finish(): Promise<void> {
    if (this.replaying) {
      this.commitReplay();
      return Promise.resolve();
    }
    this.flush();
    return new Promise((resolve) => {
      this.brush.finalizeStroke(() => {
        const ctx = this.base.getContext("2d")!;
        ctx.globalCompositeOperation = this.active?.tool === "eraser" ? "destination-out" : "source-over";
        ctx.drawImage(this.layer, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        this.active = null;
        cancelAnimationFrame(this.frame);
        if (this.tracking) this.remember();
        if (!this.disposed && !this.paused) this.paint();
        resolve();
      });
      this.brush.render();
    });
  }

  /** The finished 1200×900 drawing as WebP, from the retained raster rather than the screen. */
  exportWebp(): Promise<string | null> {
    const snapshot = surface();
    const ctx = snapshot.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(this.base, 0, 0);
    return new Promise((resolve) => {
      snapshot.toBlob((blob) => {
        if (!blob || blob.type !== "image/webp") { resolve(null); return; }
        void blob.arrayBuffer().then((buffer) => {
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let index = 0; index < bytes.length; index += 0x8000) {
            binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
          }
          resolve(btoa(binary));
        }).catch(() => resolve(null));
      }, "image/webp", 0.92);
    });
  }

  async restore(strokes: readonly Stroke[], options?: { quiet?: boolean }) {
    if (this.tracking) {
      this.frames = [];
      this.undone = [];
      this.omitted = 0;
    }
    const quiet = options?.quiet ?? false;
    const wasPaused = this.paused;
    if (quiet) this.paused = true;
    try {
      this.base.getContext("2d")!.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (!quiet) this.paint();
      for (const stroke of strokes) {
        if (this.disposed) return;
        await this.append(stroke);
      }
    } finally {
      if (quiet) {
        this.paused = wasPaused;
        if (!this.disposed && !this.paused) this.paint();
      }
    }
  }

  async append(stroke: Stroke) {
    this.begin(stroke);
    for (const point of stroke.points) this.point(point);
    await this.finish();
  }

  /** True when the previous picture is still kept, including a blank canvas before the first stroke. */
  canRewind() {
    return this.frames.length > 1 || (this.frames.length === 1 && this.omitted === 0);
  }

  canReplay() {
    return this.undone.length > 0;
  }

  rewind() {
    const current = this.frames.pop();
    if (!current) return;
    this.undone.push(current);
    this.show(this.frames.at(-1));
  }

  replayForward() {
    const next = this.undone.pop();
    if (!next) return;
    this.frames.push(next);
    this.show(next);
  }

  private remember() {
    this.undone = [];
    const copy = surface();
    copy.getContext("2d")!.drawImage(this.base, 0, 0);
    this.frames.push(copy);
    if (this.frames.length > this.kept) {
      this.frames.shift();
      this.omitted += 1;
    }
  }

  private show(source: HTMLCanvasElement | undefined) {
    const ctx = this.base.getContext("2d")!;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (source) ctx.drawImage(source, 0, 0);
    this.paint();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
  }

  pause() {
    this.paused = true;
    cancelAnimationFrame(this.frame);
  }

  resume() {
    this.paused = false;
    if (this.disposed) return;
    this.paint();
    if (this.active) this.animate();
  }
}
