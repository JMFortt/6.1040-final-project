<script setup lang="ts">
export type Page = "home" | "timelapses" | "community";

defineProps<{ current: Page; username: string }>();
const emit = defineEmits<{ navigate: [page: Page]; practice: []; help: []; signOut: [] }>();

const pages: { id: Page; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "timelapses", label: "My artworks" },
  { id: "community", label: "Community" },
];
</script>

<template>
  <header class="nav">
    <button class="wordmark" aria-label="Redraw home" @click="emit('navigate', 'home')">redraw<span>/</span></button>
    <nav aria-label="Main">
      <ul>
        <li v-for="page in pages" :key="page.id">
          <button class="tab" :class="{ active: current === page.id }" :aria-current="current === page.id ? 'page' : undefined" @click="emit('navigate', page.id)">{{ page.label }}</button>
        </li>
      </ul>
    </nav>
    <div class="actions">
      <button class="practice" @click="emit('practice')">Start Daily Practice</button>
      <button class="quiet" @click="emit('help')">Help</button>
      <span class="me" :title="`Signed in as ${username}`">{{ username }}</span>
      <button class="quiet" @click="emit('signOut')">Sign out</button>
    </div>
  </header>
</template>

<style scoped>
.nav { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 28px; padding: 12px 28px; border-bottom: 1px solid #dfe2d8; background: #fcfcf8; color: #27372d; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 8px 14px; min-height: 40px; font-size: 13px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.wordmark { font-size: 25px; font-weight: 700; letter-spacing: -1px; background: none; border: 0; padding: 0; }
.wordmark span { color: #929a77; }
ul { list-style: none; display: flex; gap: 4px; margin: 0; padding: 0; }
.tab { border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: none; padding: 10px 12px; color: #70776e; font-size: 14px; }
.tab:hover { color: #27372d; }
.tab.active { color: #27372d; border-bottom-color: #465a3d; font-weight: 600; }
.actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.practice { background: #465a3d; color: white; border-color: #465a3d; }
.quiet { background: none; border-color: transparent; color: #57605a; }
.quiet:hover { border-color: #d5dcc7; }
.me { font-size: 13px; padding: 0 4px; max-width: 14ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 760px) {
  .nav { padding: 10px 16px; gap: 6px 12px; }
  nav { order: 3; width: 100%; overflow-x: auto; }
  .actions { gap: 4px; }
  .me { display: none; }
}
</style>
