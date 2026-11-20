# 6.1040 Final Project
## Aden A., Eric A., Julia F., Amina L.

The team bios are available [here](team.md).

Class principles, the sync-engine stack, and notes on our design goals are in [agents/](agents/README.md).

The mentor meeting notes for the project are available [here](mentor-meetings/mentor-meetings.md).

Our problem framing deliverables are available [here](deliverables/F2.md)

Our concept design deliverables are available [here](deliverables/F3/main.md)

## Running the app

The running app is account sign-in (ConceptBox’s Registering, Authenticating, Federating, and Sessioning). Redraw’s practice concepts are not in this build yet.

Copy `.env.example` to `.env` if you do not already have one. Then, from this folder:

| Command | What it does |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run db:up` | Start local MongoDB (Podman) |
| `bun run dev` | MongoDB, the API on port 3000, and the Vue app at http://127.0.0.1:8080 |
| `bun test` | Concept tests and the password sign-in flow. Needs MongoDB running |
| `bun run check` | Spec, generated artifacts, and TypeScript |
| `bun run down` | Stop the Podman containers |

Open http://127.0.0.1:8080, create an account, and sign in. `bun run dev` keeps watching files. Stop it with Ctrl+C. MongoDB keeps running until `bun run down` or `bun run db:reset` (reset deletes local data).
