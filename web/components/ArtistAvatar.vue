<script setup lang="ts">
import { computed } from "vue";

/** A colored initial for an artist. The color is stable for a username. */
const props = defineProps<{ username: string | null; size?: number }>();
const palette = ["#465a3d", "#7a3e2b", "#3b5a6b", "#6b4a7a", "#8a6a2b", "#2f6b5a"];
const color = computed(() => {
  const name = props.username ?? "?";
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
});
</script>

<template>
  <span class="avatar" aria-hidden="true" :style="{ background: color, width: `${size ?? 40}px`, height: `${size ?? 40}px`, fontSize: `${(size ?? 40) * 0.42}px` }">{{ (username ?? "?").charAt(0).toUpperCase() }}</span>
</template>

<style scoped>
.avatar { display: inline-grid; place-items: center; flex: none; border-radius: 50%; color: white; font-weight: 600; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
</style>
