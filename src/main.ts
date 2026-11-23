import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { join, normalize, sep } from "node:path";
import { assembleApplication } from "./assembly.ts";
import { CommonsProvider } from "./concepts/Federating/provider.ts";
import { db } from "./db.ts";
import { redrawPolicy } from "./http.ts";
import { stockReferenceBank } from "./practice/stock.ts";

const publicOrigin = process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:8080";
const stocked = await stockReferenceBank(db);
if (stocked > 0) console.log(`Stocked ${stocked} reference photos.`);
const application = assembleApplication({
  database: db,
  commons: new CommonsProvider({
    origin: process.env.COMMONS_ORIGIN ?? "https://class.mit-sdg.dev",
    app: publicOrigin,
  }),
});
const gateway = createGateway({ application });
const api = createHttpHandler({ application, gateway, policy: redrawPolicy(publicOrigin) });
const dist = join(import.meta.dir, "..", "dist");
const noReferrer = { "Referrer-Policy": "no-referrer" };

function fileUnderDist(pathname: string) {
  const relative = pathname === "/" || pathname === "/auth/commons/callback" ? "index.html" : pathname.slice(1);
  const resolved = normalize(join(dist, decodeURIComponent(relative)));
  const root = dist.endsWith(sep) ? dist : dist + sep;
  if (resolved !== dist && !resolved.startsWith(root)) return undefined;
  return resolved;
}

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/api/*": api,
    "/health": async () => {
      try {
        await db.collection("registering.users").findOne({}, { maxTimeMS: 2000 });
        return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
    },
  },
  async fetch(request) {
    const target = fileUnderDist(new URL(request.url).pathname);
    if (target === undefined) return new Response("Not found", { status: 404 });
    const file = Bun.file(target);
    if (await file.exists()) return new Response(file, { headers: noReferrer });
    const homepage = Bun.file(join(dist, "index.html"));
    if (await homepage.exists()) return new Response(homepage, { headers: noReferrer });
    return Response.json({ error: "Frontend is not built. Run `bun run build`." }, { status: 503 });
  },
});

console.log(`Redraw listening on ${server.url}`);
