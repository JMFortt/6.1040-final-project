# Standing rules

This is the 6.1040 final project. The app is **Redraw**. Design states the behavior. Code, once it exists, is a translation of concept specifications and reactions.

Class ideas live in `readings/`, `modularity.md`, and `rubrics/`. Final-project logistics live in `assignment.md`. Redraw’s goals live in `project.md`. Follow that split when adding notes.

## What you may change

- `agents/` — this handbook. Update it when a decision or a lesson should stick.
- The account boilerplate in `design/`, `src/`, and `web/` (Registering, Authenticating, Federating, Sessioning, and their sign-in compositions).
- Redraw product concepts **only after the team asks to implement one**. Translate it from `deliverables/` into `design/` first. Do not edit the deliverable.

## What you do not change unless a teammate explicitly asks

- `deliverables/` — framing, concept design, journey, visual study, development plan
- `mentor-meetings/`
- `team.md`
- Any other write-up the team is treating as a submission

If a deliverable and a later executable spec disagree, ask. Do not edit the deliverable so they match.

## Always

- Read this file and `project.md` before design or code changes.
- Keep each concept independent. Compose concepts only with reactions.
- Give each concept one purpose. Prefer a familiar concept when its purpose already fits.
- Treat `deliverables/F3/` as the current design. `deliverables/F2.md` is the earlier framing.
- Ask before adding a library, service, or framework outside the allowed stack.
- Use Bun for install, run, test, and generate once the app exists. See `howtos/`.
- If the spec is silent, stop. Record the gap in `working-notes.md` and ask. Do not fill it in code.

## Never

- Never import one concept class from another, or call another concept’s actions from inside a concept.
- Never share mutable objects across concepts. Pass identities and immutable values.
- Never store or read another concept’s fields because a screen wants them nearby.
- Never mention Redraw, HTTP, the canvas, or other concepts inside a concept’s state or actions. Notes and reactions may.
- Never organize modules around nouns (`User`, `Drawing`, `Photo`) instead of activities.
- Never merge two purposes, or split one lifecycle, to make the code easier.
- Never add a Redraw concept, or edit a deliverable, while doing something else.

## Allowed stack

The course requires the sync engine. Match the class template described in `howtos/`:

- Bun
- TypeScript
- MongoDB, local while developing
- `@mit-sdg/sync-engine` and `@mit-sdg/sync-engine-http` on the same version (the template uses 1.1.0)
- **Vue 3** for the frontend. [P2](https://61040.github.io/fa26/assignments/p2/) requires it: Bun for the platform, MongoDB for data, Vue.js for the UI. Use the Composition API and single-file components (`<script setup lang="ts">`), as on the [Vue technical resources](https://61040.github.io/fa26/resources/technical/). Vite serves and builds that frontend.

Most of the UI belongs in `.vue` files (`web/App.vue`, `web/components/`). Shared view state belongs in composables (`web/composables/`) that those components call. Keep these outside the components: `web/index.html` (a mount point), `web/main.ts` (`createApp`), `web/client.ts` (the typed HTTP client), `vite.config.ts`, and a small Bun server that serves the production build and proxies `/api`. Do not implement a screen as a hand-written DOM script. The sync-engine local-dev guide’s first tutorial is plain HTML; that tutorial is not this project’s frontend.

The assignment allows an extra technology (a CSS framework, an external API) when the team chooses it. Record that choice in `working-notes.md` before adding the dependency. A second UI framework, a second backend framework, an ORM, or an auth library still needs an explicit decision.

## Order of work when asked to implement a concept

1. Read the deliverable. Do not edit it.
2. Check `readings/` (7–12) and `rubrics/concept-design.md`. If the spec omits behavior you would have to invent, or it breaks independence, stop and ask.
3. Write `design/concepts/Name.md` in course format. Bind it in `design/types.md`. Write reactions under `design/compositions/`.
4. Implement the class, registry, and composition so they match that executable spec.
5. Run the checks in `howtos/04-sync-engine-local.md`.

The UI is Vue components that call composed endpoints through the typed client. It does not reimplement a concept.
