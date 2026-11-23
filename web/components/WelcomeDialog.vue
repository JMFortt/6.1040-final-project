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
    <p class="eyebrow">WELCOME TO REDRAW</p>
    <h2 id="welcome-title">A place to practice drawing fundamentals, a little every week.</h2>
    <p>Redraw is for people who already draw and want steadier, more structured practice. It doesn't teach step by step or grade your artworks. It helps you show up regularly and learn from how others work.</p>
    <ol>
      <li><strong>Start Daily Practice.</strong> Draw on your private canvas with ink, dry brush, graphite, and an eraser. Every stroke saves as you go.</li>
      <li><strong>Submit your artwork.</strong> You can play its timelapse stroke by stroke from My artworks.</li>
      <li><strong>Keep your weekly streak.</strong> Submit at least one artwork each week, Monday to Sunday (Eastern Time), and your streak grows.</li>
      <li><strong>Share and learn.</strong> Share an artwork with the community, and follow artists to see how they build up their work in your feed.</li>
    </ol>
    <p class="soon">Coming soon: reference photos chosen for specific fundamentals, such as perspective and lighting, and a view of which fundamentals you've practiced most and least.</p>
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
.eyebrow { font-size: 10px; letter-spacing: 2px; color: #70776e; margin: 0 0 12px; }
h2 { font-family: Georgia, serif; font-weight: 400; font-size: 26px; line-height: 1.25; margin: 0 0 16px; }
p, li { font-size: 14px; line-height: 1.6; color: #57605a; }
p { margin: 0 0 16px; }
ol { margin: 0 0 16px; padding-left: 20px; display: grid; gap: 10px; }
strong { color: #27372d; }
.soon { padding: 12px 14px; background: #eef1e6; border-radius: 10px; font-size: 13px; }
.again { font-size: 13px; }
.buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-top: 8px; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 10px 18px; min-height: 44px; font-size: 14px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.practice { background: #465a3d; color: white; border-color: #465a3d; }
</style>
