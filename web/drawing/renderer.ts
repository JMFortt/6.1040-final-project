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

  constructor(private readonly view: HTMLCanvasElement) {
    view.width = CANVAS_WIDTH;
    view.height = CANVAS_HEIGHT;
    view.getContext("2d", { willReadFrequently: true });
    this.brush.maxUndoRedoStackSize = 0;
    this.brush.loadContext(this.layer);
    // Bind a fresh object: Easy-Brush 0.5.0's default config is shared across instances.
    this.brush.bindConfig({ color: "#000000", size: 8, flow: 1, opacity: 1, spacing: 0.12, roundness: 1, angle: 0 });
    this.brush.useModule({ onChangeConfig: (config, pressure) => {
      config.size *= Math.max(0.12, pressure);
    } });
  }

  begin(stroke: Stroke) {
    this.active = stroke;
    this.brush.clear();
    this.brush.loadConfig({
      color: stroke.tool === "eraser" ? "#000000" : stroke.color,
      size: stroke.size, opacity: stroke.opacity,
      flow: stroke.tool === "graphite" ? 0.3 : stroke.tool === "dry-brush" ? 0.75 : 1,
      spacing: stroke.tool === "graphite" ? 0.08 : 0.12,
    });
    const mask = tip(stroke.tool);
    const context = this.shape.getContext("2d")!;
    context.putImageData(mask.pixels, 0, 0);
    context.globalAlpha = mask.alpha;
    this.brush.loadImage(this.shape);
    this.animate();
  }

  point(point: StrokePoint) {
    this.brush.putPoint(point.x, point.y, point.pressure);
    this.brush.render();
  }

  private paint() {
    const ctx = this.view.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(this.base, 0, 0);
    if (this.active) {
      ctx.globalCompositeOperation = this.active.tool === "eraser" ? "destination-out" : "source-over";
      ctx.drawImage(this.layer, 0, 0);
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
    return new Promise((resolve) => {
      this.brush.finalizeStroke(() => {
        const ctx = this.base.getContext("2d")!;
        ctx.globalCompositeOperation = this.active?.tool === "eraser" ? "destination-out" : "source-over";
        ctx.drawImage(this.layer, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        this.active = null;
        cancelAnimationFrame(this.frame);
        if (!this.disposed && !this.paused) this.paint();
        resolve();
      });
      this.brush.render();
    });
  }

  async restore(strokes: readonly Stroke[]) {
    this.base.getContext("2d")!.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.paint();
    for (const stroke of strokes) {
      if (this.disposed) return;
      this.begin(stroke);
      for (const point of stroke.points) this.point(point);
      await this.finish();
    }
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
