<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { api } from "../client.ts";
import CommunityFeed from "./CommunityFeed.vue";

defineProps<{ username: string }>();
const emit = defineEmits<{ practice: []; timelapses: []; artists: [] }>();

const streak = ref<number | null>(null);
const streakError = ref("");
let disposed = false;

async function loadStreak() {
  streakError.value = "";
  try {
    const result = await api.streaks.current();
    if (disposed) return;
    if ("error" in result) throw new Error(result.error === "UNAUTHORIZED" ? "Your session ended. Sign in again." : "Could not load your streak.");
    streak.value = result.streakCount;
  } catch (cause) {
    if (!disposed) streakError.value = cause instanceof Error ? cause.message : "Could not load your streak.";
  }
}

onMounted(loadStreak);
onBeforeUnmount(() => { disposed = true; });
</script>

<template>
  <main class="home">
    <section class="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" class="visually-hidden">Home</h1>
      <div class="practice-block">
        <p class="greeting">Welcome back, {{ username }}.</p>
        <button class="practice" @click="emit('practice')">Start Daily Practice</button>
      </div>
      <div class="streak" aria-labelledby="streak-title" role="group">
        <p id="streak-title" class="label">Weekly streak</p>
        <p v-if="streakError" class="error" role="alert">{{ streakError }} <button class="retry" @click="loadStreak">Retry</button></p>
        <template v-else>
          <p class="count" aria-live="polite"><strong>{{ streak ?? "–" }}</strong> {{ streak === 1 ? "week" : "weeks" }}</p>
          <p class="hint">{{ streak === 0 ? "Submit a drawing this week to start one." : "Submit a drawing each week, Monday to Sunday, to keep it going." }}</p>
        </template>
      </div>
    </section>

    <div class="below">
      <CommunityFeed :username="username" @timelapses="emit('timelapses')" @artists="emit('artists')" />
    </div>
  </main>
</template>

<style scoped>
.home { min-height: calc(100dvh - 65px); background: #f3f5ee; color: #27372d; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
/* The first screen holds only practice and the streak; the feed starts below it. */
.hero { min-height: min(62dvh, 560px); max-width: 860px; margin: auto; padding: 48px 28px; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 48px; }
.practice-block { display: grid; gap: 24px; justify-items: start; }
.greeting { margin: 0; font-family: Georgia, serif; font-size: 36px; line-height: 1.2; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.practice { background: #465a3d; color: white; border-color: #465a3d; font-size: 20px; padding: 20px 40px; min-height: 64px; border-radius: 14px; box-shadow: 0 8px 24px rgba(70, 90, 61, 0.22); }
.practice:hover { background: #3c4e34; }
.streak { min-width: 220px; padding: 24px 28px; background: white; border: 1px solid #dfe2d8; border-radius: 16px; display: grid; gap: 6px; text-align: center; }
.label { margin: 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #70776e; }
.count { margin: 0; font-size: 16px; color: #57605a; }
.count strong { display: block; font-family: Georgia, serif; font-size: 64px; font-weight: 400; line-height: 1.1; color: #465a3d; }
.hint { margin: 0; max-width: 24ch; justify-self: center; color: #70776e; font-size: 12px; line-height: 1.5; }
.error { margin: 0; color: #88492d; font-size: 13px; }
.retry { padding: 6px 12px; font-size: 12px; }
.below { max-width: 680px; margin: auto; padding: 32px 28px 64px; border-top: 1px solid #dfe2d8; }
@media (max-width: 760px) {
  .hero { grid-template-columns: 1fr; min-height: 0; padding: 32px 16px; gap: 28px; }
  .greeting { font-size: 28px; }
  .practice { width: 100%; }
  .practice-block { justify-items: stretch; }
  .below { padding: 24px 16px 48px; }
}
</style>
