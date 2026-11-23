<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { api } from "../client.ts";

/** Shares one of the signed-in artist's timelapses to the community feed, or unshares it. */
const props = defineProps<{ index: number }>();
type SharedPost = Extract<Awaited<ReturnType<typeof api.posts.status>>, { post: unknown }>["post"];

/** The timelapse's post: undefined while unknown, null when private. */
const shared = ref<SharedPost | undefined>(undefined);
const saving = ref(false);
const error = ref("");
let disposed = false;

async function load() {
  shared.value = undefined;
  error.value = "";
  const result = await api.posts.status({ index: props.index });
  if (disposed) return;
  if ("error" in result) error.value = "Could not check whether this timelapse is shared.";
  else shared.value = result.post;
}

async function toggle() {
  if (saving.value || shared.value === undefined) return;
  saving.value = true;
  error.value = "";
  try {
    if (shared.value === null) {
      const result = await api.posts.publish({ index: props.index });
      if (disposed) return;
      if ("error" in result && result.error !== "CONFLICT") throw new Error("Could not share this timelapse. Try again.");
      if ("error" in result) return void load();
      shared.value = result.post;
    } else {
      const result = await api.posts.retract({ post: shared.value });
      if (disposed) return;
      if ("error" in result && result.error !== "NOT_FOUND") throw new Error("Could not unshare this timelapse. Try again.");
      shared.value = null;
    }
  } catch (cause) { error.value = cause instanceof Error ? cause.message : "Could not update sharing."; }
  finally { saving.value = false; }
}

onMounted(load);
onBeforeUnmount(() => { disposed = true; });
</script>

<template>
  <div class="share">
    <button :disabled="saving || shared === undefined" :aria-pressed="!!shared" @click="toggle">{{ saving ? "Saving…" : shared ? "Unshare" : "Share to community" }}</button>
    <p v-if="shared" class="note">Shared: other signed-in artists can watch this timelapse.</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.share { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; }
button { font: inherit; font-size: 13px; cursor: pointer; border: 1px solid #465a3d; border-radius: 8px; background: white; color: #465a3d; padding: 8px 14px; min-height: 40px; }
button[aria-pressed="false"] { background: #465a3d; color: white; }
button:disabled { cursor: progress; opacity: 0.6; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.note { margin: 0; font-size: 12px; color: #70776e; }
.error { margin: 0; font-size: 12px; color: #88492d; }
</style>
