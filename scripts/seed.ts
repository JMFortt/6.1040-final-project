/**
 * Seeds the development database with example artists who have shared timelapses,
 * so the community feed has people to follow.
 *
 *   bun scripts/seed.ts
 *
 * Everything goes through the app's own endpoints (register, draw, submit, publish,
 * follow, like), in process. No concept state is written directly. Running it again
 * skips artists who already exist. Every seed artist uses the password below; these
 * are development accounts only.
 */
import { CANVAS_HEIGHT, CANVAS_WIDTH, RENDERER, type Stroke, type StrokePoint, type Tool } from "../src/drawing/stroke.ts";
import { client, db } from "../src/db.ts";
import { createApp, type RedrawApi } from "../tests/app.ts";

export const SEED_PASSWORD = "redraw-seed-123";

type Pen = { tool: Tool; color: string; size: number; opacity?: number };
type Point = [number, number];

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** A stroke through the given points, densified, with a pressure swell and steady timing. */
function stroke(pen: Pen, path: Point[]): Stroke {
  const points: StrokePoint[] = [];
  let time = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i]!;
    const [x2, y2] = path[i + 1]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 6));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      points.push({ x: clamp(x1 + (x2 - x1) * t, 0, CANVAS_WIDTH), y: clamp(y1 + (y2 - y1) * t, 0, CANVAS_HEIGHT), pressure: 0, time });
      time += 9;
    }
  }
  const [lx, ly] = path.at(-1)!;
  points.push({ x: clamp(lx, 0, CANVAS_WIDTH), y: clamp(ly, 0, CANVAS_HEIGHT), pressure: 0, time });
  const n = points.length;
  points.forEach((p, i) => { p.pressure = Number((0.25 + 0.7 * Math.sin(Math.PI * (n === 1 ? 0.5 : i / (n - 1)))).toFixed(3)); });
  return { renderer: RENDERER, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, tool: pen.tool, color: pen.color, size: pen.size, opacity: pen.opacity ?? 1, points: points.slice(0, 4096) };
}

const line = (pen: Pen, a: Point, b: Point) => stroke(pen, [a, b]);
const curve = (pen: Pen, f: (t: number) => Point, steps = 48) => stroke(pen, Array.from({ length: steps + 1 }, (_, i) => f(i / steps)));
const ellipse = (pen: Pen, cx: number, cy: number, rx: number, ry: number, from = 0, to = Math.PI * 2) =>
  curve(pen, (t) => [cx + rx * Math.cos(from + (to - from) * t), cy + ry * Math.sin(from + (to - from) * t)], 64);

/** Two-point perspective boxes on a shared horizon. */
function perspectiveBoxes(): Stroke[] {
  const ink: Pen = { tool: "ink", color: "#252b25", size: 4 };
  const guide: Pen = { tool: "graphite", color: "#8a8f86", size: 2, opacity: 0.6 };
  const horizon = 330, left: Point = [40, horizon], right: Point = [1160, horizon];
  const out: Stroke[] = [line(guide, [20, horizon], [1180, horizon])];
  for (const [x, top, bottom, depth] of [[600, 420, 700, 160], [300, 470, 640, 90], [900, 450, 660, 110]] as const) {
    const towards = (p: Point, v: Point, k: number): Point => [p[0] + (v[0] - p[0]) * k, p[1] + (v[1] - p[1]) * k];
    const k = depth / 600;
    const a: Point = [x, top], b: Point = [x, bottom];
    const al = towards(a, left, k), bl = towards(b, left, k), ar = towards(a, right, k), br = towards(b, right, k);
    out.push(line(guide, a, left), line(guide, a, right), line(guide, b, left), line(guide, b, right));
    out.push(line(ink, a, b), line(ink, al, bl), line(ink, ar, br), line(ink, a, al), line(ink, a, ar), line(ink, b, bl), line(ink, b, br));
  }
  return out;
}

/** A sphere with a cast shadow, built up in hatching. */
function shadedSphere(): Stroke[] {
  const graphite: Pen = { tool: "graphite", color: "#3b3f3a", size: 3, opacity: 0.8 };
  const cx = 600, cy = 430, r = 210;
  const out: Stroke[] = [ellipse({ ...graphite, size: 4 }, cx, cy, r, r)];
  for (let i = 0; i < 26; i++) {
    const y = cy - r * 0.2 + i * 14;
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) ** 2));
    if (half > 10) out.push(line(graphite, [cx + half * 0.1 - i * 3, y], [cx + half - 4, y - 30]));
  }
  out.push(ellipse({ tool: "dry-brush", color: "#5d625b", size: 26, opacity: 0.5 }, cx + 70, cy + r + 20, r * 1.1, 34));
  out.push(ellipse({ tool: "graphite", color: "#a5aaa2", size: 2, opacity: 0.6 }, cx - 70, cy - 80, 38, 30));
  return out;
}

/** Quick gesture figures: a line of action, a head, and limbs. */
function gestures(): Stroke[] {
  const brush: Pen = { tool: "dry-brush", color: "#7a3e2b", size: 9, opacity: 0.85 };
  const out: Stroke[] = [];
  for (const [x, lean] of [[260, 1], [600, -1.4], [940, 0.6]] as const) {
    out.push(ellipse({ ...brush, size: 6 }, x + 40 * lean, 220, 34, 40));
    out.push(curve(brush, (t) => [x + 40 * lean - lean * 90 * Math.sin(Math.PI * t), 265 + t * 330]));
    out.push(curve(brush, (t) => [x - lean * 30 + t * 120 * Math.sign(lean || 1), 320 + Math.sin(t * 3) * 40]));
    out.push(curve(brush, (t) => [x - lean * 40 - t * 110, 330 + t * 120]));
    out.push(curve(brush, (t) => [x + 20 * lean + t * 80, 595 + t * 180]));
    out.push(curve(brush, (t) => [x + 20 * lean - t * 70, 595 + t * 190 - Math.sin(t * Math.PI) * 30]));
  }
  return out;
}

/** Rolling hills under a low sun, in layered dry brush. */
function landscape(): Stroke[] {
  const out: Stroke[] = [];
  for (let i = 0; i < 6; i++) out.push(line({ tool: "dry-brush", color: "#c9d8e4", size: 60, opacity: 0.5 }, [0, 60 + i * 45], [1200, 70 + i * 45]));
  out.push(ellipse({ tool: "dry-brush", color: "#e8a64a", size: 40, opacity: 0.8 }, 860, 260, 50, 50));
  const hills: [string, number, number][] = [["#8fa77a", 470, 60], ["#6d8a5b", 560, 80], ["#4e6b43", 660, 70]];
  for (const [color, base, height] of hills) {
    for (let band = 0; band < 4; band++) {
      out.push(curve({ tool: "dry-brush", color, size: 50, opacity: 0.7 }, (t) => [t * 1200, base + band * 40 - height * Math.sin(t * Math.PI * 1.6 + base)], 60));
    }
  }
  return out;
}

/** Proportion guides for a face: oval, center line, eye, nose, and mouth lines. */
function faceProportions(): Stroke[] {
  const guide: Pen = { tool: "graphite", color: "#7d827a", size: 2, opacity: 0.7 };
  const ink: Pen = { tool: "ink", color: "#2d2a26", size: 4 };
  const cx = 600, top = 140, chin = 780;
  const mid = (top + chin) / 2;
  return [
    ellipse(guide, cx, mid, 230, (chin - top) / 2),
    line(guide, [cx, top - 20], [cx, chin + 20]),
    line(guide, [cx - 260, mid], [cx + 260, mid]),
    line(guide, [cx - 200, mid + 150], [cx + 200, mid + 150]),
    line(guide, [cx - 180, mid + 230], [cx + 180, mid + 230]),
    ellipse(ink, cx - 105, mid, 52, 20), ellipse(ink, cx + 105, mid, 52, 20),
    ellipse({ ...ink, size: 6 }, cx - 105, mid, 12, 12), ellipse({ ...ink, size: 6 }, cx + 105, mid, 12, 12),
    curve(ink, (t) => [cx - 10 + Math.sin(t * Math.PI) * 25, mid + 40 + t * 110]),
    curve(ink, (t) => [cx - 90 + t * 180, mid + 230 + Math.sin(t * Math.PI) * 22]),
    curve(ink, (t) => [cx - 140 + t * 280, mid - 75 - Math.sin(t * Math.PI) * 20]),
  ];
}

/** A still life: a vase and two pieces of fruit, outlined then shaded. */
function stillLife(): Stroke[] {
  const ink: Pen = { tool: "ink", color: "#3a2f45", size: 5 };
  const out: Stroke[] = [
    line({ tool: "graphite", color: "#9a958f", size: 3, opacity: 0.6 }, [80, 640], [1120, 640]),
    curve(ink, (t) => [520 - 90 * Math.sin(t * Math.PI) - 30 * t, 220 + t * 420]),
    curve(ink, (t) => [680 + 90 * Math.sin(t * Math.PI) + 30 * t, 220 + t * 420]),
    ellipse(ink, 600, 220, 80, 22),
    ellipse({ tool: "dry-brush", color: "#c4553a", size: 14 }, 840, 590, 70, 52),
    ellipse({ tool: "dry-brush", color: "#d9a43b", size: 14 }, 330, 595, 62, 48),
  ];
  for (let i = 0; i < 10; i++) out.push(line({ tool: "graphite", color: "#4a4352", size: 3, opacity: 0.7 }, [655 + i * 6, 300 + i * 30], [700 + i * 3, 290 + i * 30]));
  return out;
}

const ARTISTS: { username: string; drawings: (() => Stroke[])[]; follows: string[] }[] = [
  { username: "mira_lines", drawings: [perspectiveBoxes, stillLife], follows: ["theo_graphite", "lena_portraits"] },
  { username: "theo_graphite", drawings: [shadedSphere, stillLife], follows: ["mira_lines"] },
  { username: "june_gesture", drawings: [gestures, faceProportions], follows: ["lena_portraits", "kofi_landscapes"] },
  { username: "kofi_landscapes", drawings: [landscape, perspectiveBoxes], follows: ["june_gesture"] },
  { username: "lena_portraits", drawings: [faceProportions, shadedSphere], follows: ["june_gesture", "mira_lines", "theo_graphite"] },
];

async function must<T extends object>(label: string, answer: Promise<T | { error: string }>): Promise<T> {
  const result = await answer;
  if ("error" in result) throw new Error(`${label} failed: ${result.error}`);
  return result as T;
}

/** Draws each picture stroke by stroke, submits it as a timelapse, and shares it. */
async function drawAndShare(api: RedrawApi, drawings: (() => Stroke[])[]) {
  const history = await must("history", api.canvas.history({ after: 0 }));
  let sequence = history.tip + 1;
  const posts: string[] = [];
  for (const draw of drawings) {
    const started = Date.now();
    for (const value of draw()) {
      await must("stroke", api.canvas.stroke({ key: crypto.randomUUID(), sequence, timestamp: started, change: JSON.stringify(value) }));
      sequence++;
    }
    const { index } = await must("submit", api.canvas.submit({ key: crypto.randomUUID(), sequence }));
    sequence++;
    posts.push((await must("publish", api.posts.publish({ index }))).post);
  }
  return posts;
}

async function main() {
  const { browser } = createApp(db);
  const sessions = new Map<string, RedrawApi>();
  const created: string[] = [];
  for (const artist of ARTISTS) {
    const api = browser();
    const registered = await api.auth.register({ username: artist.username, password: SEED_PASSWORD });
    if ("error" in registered) {
      if (registered.error !== "CONFLICT") throw new Error(`register ${artist.username} failed: ${registered.error}`);
      console.log(`· ${artist.username} already exists, skipping`);
      continue;
    }
    sessions.set(artist.username, api);
    created.push(artist.username);
    const posts = await drawAndShare(api, artist.drawings);
    console.log(`✓ ${artist.username}: shared ${posts.length} timelapses`);
  }
  for (const artist of ARTISTS) {
    const api = sessions.get(artist.username);
    if (!api) continue;
    for (const username of artist.follows) await api.people.follow({ username });
  }
  // Every new seed artist likes the newest posts by the artists they follow.
  for (const artist of ARTISTS) {
    const api = sessions.get(artist.username);
    if (!api) continue;
    const feed = await must("feed", api.posts.feed({ before: "" }));
    for (const post of feed.page.posts.filter(p => p.following && !p.liked)) await api.posts.like({ post: post.post });
  }
  console.log(created.length
    ? `\nSeeded ${created.length} artists. Sign in as any of them with password "${SEED_PASSWORD}", or follow them from your own account.`
    : "\nNothing to do: every seed artist already exists.");
}

try { await main(); }
finally { await client.close(); }
