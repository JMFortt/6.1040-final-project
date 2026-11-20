# Class how-tos

Course list: [Resources](https://61040.github.io/fa26/resources/).

The class app stack is **Bun** on the server, **MongoDB**, the **sync engine**, and **Vue 3** in the browser. [P2](https://61040.github.io/fa26/assignments/p2/) names those four. Use `bun`, `bunx`, `bun run`, `bun test`, and `bun add` for the platform. The frontend is Vue single-file components, built and served in development by Vite (`@vitejs/plugin-vue`). Do not introduce npm, pnpm, yarn, or a second UI framework without an explicit team decision.

This repo does not contain the app yet. The commands below are the class template’s commands. They will work here after that template is added. Do not invent a second set of scripts.

| # | Note | Original |
| --- | --- | --- |
| 1 | [Repo setup](01-repo-setup.md) | [page](https://61040.github.io/fa26/guides/repo/) |
| 2 | [Submit a commit URL](02-commit-hash.md) | [page](https://61040.github.io/fa26/guides/hash/) |
| 3 | [MongoDB locally](03-mongodb.md) | [page](https://61040.github.io/fa26/resources/mongodb-setup/) |
| 4 | [Sync-engine app locally](04-sync-engine-local.md) | [page](https://61040.github.io/fa26/resources/sync-engine-local-dev/) |
| 5 | [Deploy on 6.1040 Apps](05-deploying-apps.md) | [page](https://61040.github.io/fa26/resources/deploying-apps/) |
| 6 | [ConceptBox](06-conceptbox.md) | [repo](https://github.com/mit-sdg/conceptbox) |

Related reading list: [Technical resources](technical-resources.md) ([course page](https://61040.github.io/fa26/resources/technical/)).

## Defaults

- Install with `bun add` / `bun add -d`. A new package needs permission (`../AGENTS.md`).
- Develop against local MongoDB only. Never a hosted cluster while developing.
- Check with `bun run check:design` and `bun run check` once `design/` and `src/` exist.
- Tests, when they exist: `bun test`, on a fresh database, starting from concept actions rather than raw inserts.
