<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "../client.ts";
import { useSession } from "../composables/useSession.ts";

const emit = defineEmits<{ done: [] }>();
const { enter, error } = useSession();
const choosing = ref(false);
const username = ref("");
const working = ref(false);

onMounted(async () => {
  const query = new URLSearchParams(window.location.search);
  window.history.replaceState(null, "", "/");
  if (query.get("error") === "access_denied") {
    error.value = "Sign-in cancelled.";
    emit("done");
    return;
  }
  const finish = api.auth.commons.finish({ state: query.get("state") ?? "", code: query.get("code") ?? "" });
  const refused = await enter(finish, {
    CONFLICT: "Your Commons username is taken here.",
    INVALID_REQUEST: "Your Commons username can't be used here.",
    FORBIDDEN: "Signing in with Commons didn't work. Start again.",
  });
  if (refused === "CONFLICT" || refused === "INVALID_REQUEST") choosing.value = true;
  else emit("done");
});

async function choose() {
  working.value = true;
  const refused = await enter(api.auth.commons.choose({ username: username.value.trim() }), {
    CONFLICT: "That username is taken.",
    INVALID_REQUEST: "That username doesn't follow the rule below it.",
    FORBIDDEN: "This sign-in has expired. Start again.",
  });
  working.value = false;
  if (refused === null || refused === "FORBIDDEN") emit("done");
}
</script>

<template>
  <form v-if="choosing" class="card" @submit.prevent="choose">
    <h1>Choose a username</h1>
    <label>
      Username
      <input v-model="username" autocomplete="username" autocapitalize="off" spellcheck="false" required />
      <span class="hint">3 to 32 letters, digits, _ or -</span>
    </label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button type="submit" class="primary" :disabled="working">Continue</button>
  </form>
  <p v-else class="card">Signing in with Commons…</p>
</template>

<style scoped>
.card {
  width: min(100%, 400px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 28px;
  background: #fff;
  border-radius: 16px;
}
label { display: flex; flex-direction: column; gap: 6px; }
input { min-height: 42px; padding: 0 12px; border: 1px solid #d6d3d1; border-radius: 10px; }
.hint, .error { margin: 0; }
.hint { color: #78716c; font-size: 0.85rem; }
.error { color: #9f1239; }
.primary {
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: #1c1917;
  color: #fafaf9;
  cursor: pointer;
}
</style>
