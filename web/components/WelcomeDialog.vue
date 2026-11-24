<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; practice: [] }>();
const dialog = ref<HTMLDialogElement>();

function sync() {
  if (!dialog.value) return;
  if (props.open && !dialog.value.open) dialog.value.showModal();
  if (!props.open && dialog.value.open) dialog.value.close();
}
onMounted(sync);
watch(() => props.open, sync);

function practice() {
  emit("close");
  emit("practice");
}
</script>

<template>
  <!-- The native dialog traps focus, closes on Escape, and reports that through its close event. -->
  <dialog ref="dialog" class="welcome" aria-labelledby="welcome-title" @close="emit('close')">
    <h2 id="welcome-title">Welcome to Redraw!</h2>
    <p>Redraw is a tool for artists to practice in a steady and structured way. It doesn't teach step by step or grade your artworks. Instead, it helps you build a habit and learn from others in the community.</p>
    <ol>
      <li><strong>Start Daily Practice.</strong> Once you select a fundamental to practice (e.g. color, form), you're given a time limit to replicate a reference photo that exhibits that fundamental. After the time is up, you can save it to your private gallery.</li>
      <li><strong>Keep your weekly streak.</strong> Complete at least one artwork each week, Monday to Sunday (Eastern Time), to maintain your streak.</li>
      <li><strong>Share and learn.</strong> Share your saved artwork with the community and follow artists to see how they drew the same references using the timelapse viewer.</li>
    </ol>
    <p class="again">You can reopen this anytime with <strong>Help</strong> at the top of the page.</p>
    <div class="buttons">
      <button class="secondary" @click="emit('close')">Got it</button>
      <button class="practice" @click="practice">Start Daily Practice</button>
    </div>
  </dialog>
</template>

<style scoped>
.welcome { width: min(560px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: auto; padding: 32px; border: 1px solid #dfe2d8; border-radius: 16px; background: #fcfcf8; color: #27372d; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; box-shadow: 0 20px 60px rgba(28, 37, 30, 0.18); }
.welcome::backdrop { background: rgba(39, 55, 45, 0.35); }
h2 { font-family: Georgia, serif; font-weight: 400; font-size: 26px; line-height: 1.25; margin: 0 0 16px; }
p, li { font-size: 14px; line-height: 1.6; color: #57605a; }
p { margin: 0 0 16px; }
ol { margin: 0 0 16px; padding-left: 20px; display: grid; gap: 10px; }
strong { color: #27372d; }
.again { font-size: 13px; }
.buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-top: 8px; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 10px 18px; min-height: 44px; font-size: 14px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.practice { background: #465a3d; color: white; border-color: #465a3d; }
</style>
