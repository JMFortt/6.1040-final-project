# How to set up MongoDB for local development

Original: https://61040.github.io/fa26/resources/mongodb-setup/

Develop against a **local** MongoDB in Podman. A cloud database is slow, sleeps, and is a poor fit for agents. The driver code stays the same; deploy time only changes `MONGODB_URL`.

Local MongoDB is `compose.yaml`: `mongo:8.0`, bound to `127.0.0.1:27017`, user `dev` / password `dev`. `.env.example` sets `MONGODB_URL`. Copy it to `.env`. The app calls `client.db()` with no extra database name; the URI already names `redraw`.

## What the class template provides

- `compose.yaml` — `mongo:8.0`, bound to `127.0.0.1:27017`, user `dev` / password `dev`
- `.env` / `.env.example` — `MONGODB_URL=mongodb://dev:dev@127.0.0.1:27017/…?authSource=admin`
- One `MongoClient` at startup. Call `client.db()` with **no** extra database name; the URI already names it
- Scripts: `db:up`, `db:shell`, `db:logs`, `db:reset`

## Commands

| Command | Effect |
| --- | --- |
| `bun run db:up` | `podman compose up -d mongo` |
| `bun run db:shell` | `mongosh` as `dev` |
| `bun run db:logs` | Mongo logs |
| `bun run db:reset` | `podman compose down -v` (wipes local data) |

On Windows, after a reboot, `podman machine start` may be required before compose works.

Write `127.0.0.1`, not `localhost` (IPv6 versus IPv4). Bind ports to `127.0.0.1` so they are not exposed on the LAN.

## How concepts store state

Each concept owns its collections. Enforce uniqueness with a Mongo unique index, not check-then-insert (that races). Duplicate key `11000` maps to the spec’s refusal.

Do not connect to Mongo in a concept constructor. `bun run generate` and `bun run check` assemble the app without a live database.

## Tests

When tests exist: one fresh database per file (`test-${uuid}`), `bun test`, assert results. Prefer the container that is already running. `mongodb-memory-server` is optional and is a new package — ask first.

Start each test by calling concept **actions**, not by inserting documents.

## Rules

- Local database only while developing. Not Atlas, and not the 6.1040 Apps database.
- `db:reset` is safe for local practice data. It is not safe against any database you were not willing to delete.
