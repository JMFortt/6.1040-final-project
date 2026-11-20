# How to deploy on 6.1040 Apps

Original: https://61040.github.io/fa26/resources/deploying-apps/

Platform: [mit-sdg.dev](https://mit-sdg.dev). The address will be `https://<name>.mit-sdg.dev`. Builds run from a **GitHub commit**. The platform ignores `Dockerfile` and `compose.yaml`. Settings on the site replace `.env`.

Do not deploy until the team asks. Do not add object storage, a second database, or a second UI framework in order to “be ready.” The frontend that ships is the Vite build of the Vue app (`bun run build`). The Bun server must serve `dist/` as well as `/api`.

## What the platform needs

- A GitHub repo it can read, and a committed **`bun.lock`**
- `.env` not in git
- One server that listens on `HOST` and `PORT` (the platform sets `HOST=0.0.0.0`)
- `/health` returns HTTP 2xx when Mongo is reachable
- `packageManager` set to a Bun version in `package.json`

## Bun version

The class template has used `"packageManager": "bun@1.3.4"` with `bun run --parallel` in `start`. On the platform, **1.3.4’s `--parallel` only starts the first script.** Name **Bun 1.4.0 or newer** in `packageManager` before deploy. Flag the mismatch; do not bump the version unless the team asks.

## Cookies and origin

If HTTP policy uses a cookie or `publicOrigin`, read the origin from the environment:

```ts
publicOrigin: process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:8080"
```

On the platform set `PUBLIC_ORIGIN=https://<name>.mit-sdg.dev` (https, no trailing slash). A mismatch yields `FORBIDDEN` on session endpoints.

## Database variable

Local code uses **`MONGODB_URL`**, not `MONGODB_URI`. If the platform suggests the other name, rename it. Use `client.db()` with no name. `client.db("myapp")` fails because the app user cannot use another database.

Create **one** `MongoClient` at process start. The platform limit is on the order of 10 connections and 2 GB.

## Deploy loop

1. Rehearse what the platform will do: `bun run db:up`, then start with `PORT` and `PUBLIC_ORIGIN` set (or `bun run up`).
2. Push. On mit-sdg.dev: create the app, set `MONGODB_URL` and `PUBLIC_ORIGIN`, pick a commit, deploy. A push does not deploy by itself.
3. The first deploy takes on the order of ten minutes. Logs are on the site, analogous to `bun run logs`.

Failures worth knowing: a frozen lockfile (Bun version versus `bun.lock`); health check not bound to `0.0.0.0`; `--parallel` on Bun 1.3.4; missing env; writing to the local disk (the disk is read-only; use Mongo).

## Copying sign-in from ConceptBox

Commons sign-in and password sign-in are both in ConceptBox. Neither is chosen for Redraw until Authenticating is specified. Object storage (`S3Client`) is a new capability; ask first.
