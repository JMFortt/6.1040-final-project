/** Immutable wire format for renderer v1. Keep old renderers when adding versions. */
export const RENDERER = "easy-brush-0.5.0-v1" as const;
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;
export const MAX_POINTS = 4096;
export type Tool = "ink" | "dry-brush" | "graphite" | "eraser";
export interface StrokePoint { x: number; y: number; pressure: number; time: number }
export interface Stroke {
  renderer: typeof RENDERER;
  width: typeof CANVAS_WIDTH;
  height: typeof CANVAS_HEIGHT;
  tool: Tool;
  color: string;
  size: number;
  opacity: number;
  points: StrokePoint[];
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const range = (value: unknown, low: number, high: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= low && value <= high;

function isStroke(value: unknown): value is Stroke {
  if (!object(value) || value.renderer !== RENDERER || value.width !== CANVAS_WIDTH || value.height !== CANVAS_HEIGHT
    || typeof value.tool !== "string" || !["ink", "dry-brush", "graphite", "eraser"].includes(value.tool)
    || typeof value.color !== "string" || !/^#[0-9a-f]{6}$/i.test(value.color)
    || !range(value.size, 1, 100) || !range(value.opacity, 0.01, 1)
    || !Array.isArray(value.points) || value.points.length < 1 || value.points.length > MAX_POINTS) return false;
  let previous = 0;
  for (const point of value.points) {
    if (!object(point) || !range(point.x, 0, CANVAS_WIDTH) || !range(point.y, 0, CANVAS_HEIGHT)
      || !range(point.pressure, 0, 1) || !range(point.time, previous, 86400000)) return false;
    previous = point.time;
  }
  return true;
}

export function parseStroke(change: unknown): Stroke | null {
  if (typeof change !== "string" || change.length > 524288) return null;
  try {
    const value: unknown = JSON.parse(change);
    return isStroke(value) ? value : null;
  } catch { return null; }
}
