<script setup lang="ts">
import type { Tool } from "../../src/drawing/stroke.ts";
defineProps<{ tool: Tool }>();
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="tool === 'ink'">
      <path d="m15 3 6 6-9 11-8 1 1-8Z M4 21l7-7 M15 3l-2 7 8-1" />
      <circle cx="12" cy="13" r="1.5" />
    </template>
    <template v-else-if="tool === 'dry-brush'">
      <path d="M14 13 21 3c.5-1-1-2-2-1L9 10 M9 10l5 3-3 4-5-4Z M6 13c-4 1 0 6-4 8 8 1 10-3 9-4" />
    </template>
    <template v-else-if="tool === 'graphite'">
      <path d="m4 15 12-12 5 5L9 20l-7 2Z M13 6l5 5 M4 15l5 5 M3 19l2 2" />
    </template>
    <template v-else>
      <path d="m3 12 9-9a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-8 8H9l-6-5a2 2 0 0 1 0-3Z M7 8l10 9 M12 21h10" />
    </template>
  </svg>
</template>
