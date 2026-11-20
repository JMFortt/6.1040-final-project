# Technical resources

Original: https://61040.github.io/fa26/resources/technical/

A reading list, not a how-to. The implementation stack is Bun, TypeScript, the sync engine, and Vue 3 (`04-sync-engine-local.md`). Prefer the how-tos in this folder over a generic Node, Express, or React guide.

- Markdown and GitHub README — design write-ups and specs
- HTML, CSS, and browser DevTools — used inside Vue templates and `<style>` blocks, and for the visual design study
- HTTP — endpoints are `POST /api/…` JSON via sync-engine-http. Vue components call the typed client, not raw `fetch`, for those routes
- [Vue](https://61040.github.io/fa26/resources/technical/) — required. Set the tutorial’s API preference to **Composition** and **SFC**. P2 points at the course’s Vue prep for the same style
