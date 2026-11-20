# How to develop a sync-engine app locally

Original: https://61040.github.io/fa26/resources/sync-engine-local-dev/

**Bun** runs the backend, installs packages, and runs tests. **Vite** serves and builds the Vue frontend. [P2](https://61040.github.io/fa26/assignments/p2/) requires that split: Bun, MongoDB, sync-engine, and a Vue.js frontend. The local-dev guide’s first tutorial is a plain HTML page so the backend can be tried quickly. Replace that page with Vue. Do not leave the product UI as that tutorial.

This repository already has that layout. The running concepts are the account boilerplate in `../project.md`, not Redraw. Concept file roles: `../generating-code.md`. Local commands are the `package.json` scripts below.

## Three parts

1. **Backend** — Bun, `@mit-sdg/sync-engine`, `@mit-sdg/sync-engine-http`. Endpoints are `POST /api/…` with JSON bodies. Default port **3000**.
2. **Frontend** — Vue 3 single-file components in `web/`, built with Vite (`@vitejs/plugin-vue`). Development server on **8080**, proxying `/api` and `/health` to the backend. Components call the typed client (`baseUrl: "/api"`).
3. **MongoDB** — a Podman container. Each concept class stores its own state.

The sync engine does not store data. Switching databases would mean changing concept classes only. For class work, stay on MongoDB.

## Vue frontend

Composition API and SFCs. Course links: [technical resources](https://61040.github.io/fa26/resources/technical/) (set the Vue tutorial to Composition and SFC) and the Vue prep cited from P2.

| File | Role |
| --- | --- |
| `web/index.html` | Mount point only: `<div id="app">` and `<script type="module" src="./main.ts">` |
| `web/main.ts` | `createApp(App).mount("#app")` |
| `web/App.vue` | Root component |
| `web/components/*.vue` | Screens and controls. This is most of the frontend |
| `web/composables/*.ts` | Shared view state used by those components |
| `web/client.ts` | `createHttpClient` from `@mit-sdg/sync-engine-http/client`. Not a component |
| `vite.config.ts` | `root: "web"`, Vue plugin, proxy `/api` and `/health` to the backend |

A component reads and writes through the typed client (often via a composable). It does not reimplement a concept, and it does not talk to MongoDB.

```ts
import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { AppWireHttp } from "../generated/wire.ts";

export const api = createHttpClient<AppWireHttp>({ baseUrl: "/api" });
```

Vite proxy, same idea as the local-dev guide’s framework section:

```ts
server: {
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 8080),
  proxy: {
    "/api": { target: process.env.BACKEND_URL ?? "http://127.0.0.1:3000" },
    "/health": { target: process.env.BACKEND_URL ?? "http://127.0.0.1:3000" },
  },
},
```

`vite build` writes static files to `dist/`. For one public server (local “as deployed”, and 6.1040 Apps), the Bun process serves `dist/` and `/api` together. `PUBLIC_ORIGIN` is the address in the browser bar. In development that is `http://127.0.0.1:8080`.

Do not add React. CSS lives in `<style>` blocks and, when it is shared, a stylesheet imported from `main.ts`. HTML and CSS still matter; they sit inside the components.

## Versions in the template

sync-engine **1.1.0**, HTTP adapter **1.1.0**, `bson` pinned to `7.2.0` for Bun 1.3. Pin new sync-engine packages with `--exact`, both at the same version.

## Scripts

| Script | Role |
| --- | --- |
| `bun run generate` | `sync-engine artifacts pin` |
| `bun run check` | spec against code, artifacts, `tsc --noEmit` |
| `bun run check:design` | markdown form of `design/` |
| `bun run dev` | `db:up`, then watch the backend and run Vite |
| `bun run dev:frontend` | `vite` (Vue, port 8080, proxy to the backend) |
| `bun run build` | `vite build` → `dist/` |
| `bun run start` | Bun serves the API and the built Vue app |
| `bun run up` | Podman: mongo and the app, then a check against the public port |
| `bun run down` / `logs` | stop containers / read logs |

`dev` is for editing (watch mode). `up` is “as deployed”: image, env vars, no live host files. Stop `dev` before `up`. They share ports.

`check:design` can run before there is application code. `check` runs once there is. Action signatures use `: returns (…)` and each branch ends in `returns` or `refuses`.

## HTTP shape

- `httpPolicy({ basePath: "/api", publicErrors: { CODE: "CATEGORY" } })`
- A concept throws `SomeError("quoted message")`. The registry maps the class to `CODE`. Policy maps `CODE` to an HTTP category.
- One `MongoClient` at startup. The health check should reach the database (`/health`).

## While building

One concept or one endpoint, then `bun run check`. Do not generate the whole product in one pass. Run `bun install` after `package.json` changes. Commit `bun.lock` when the team is committing. Do not commit unless asked.
