<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Stroke } from "../../src/drawing/stroke.ts";
import { StrokeRenderer } from "../drawing/renderer.ts";

/** The finished state of a drawing, rendered once. */
const props = defineProps<{ strokes: readonly Stroke[]; label: string }>();
const canvas = ref<HTMLCanvasElement>();
let renderer: StrokeRenderer | undefined;

async function render() {
  if (!canvas.value) return;
  renderer?.dispose();
  renderer = new StrokeRenderer(canvas.value);
  await renderer.restore(props.strokes);
  renderer.pause();
}

onMounted(render);
watch(() => props.strokes, render);
onBeforeUnmount(() => renderer?.dispose());
</script>

<template>
  <canvas ref="canvas" :aria-label="label" role="img" />
</template>

<style scoped>
canvas { display: block; width: 100%; aspect-ratio: 4 / 3; background: white; }
</style>
