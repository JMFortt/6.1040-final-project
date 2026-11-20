<script setup lang="ts">
import { computed, ref } from "vue";
import { api } from "../client.ts";
import { useSession } from "../composables/useSession.ts";

const { enter, error } = useSession();
const creating = ref(false);
const username = ref("");
const password = ref("");
const working = ref(false);
const words = computed(() =>
  creating.value
    ? { action: "Create account", other: "Have an account?", switchTo: "Sign in" }
    : { action: "Sign in", other: "New here?", switchTo: "Create an account" },
);

async function submit() {
  working.value = true;
  const name = username.value.trim();
  if (creating.value) {
    await enter(api.auth.register({ username: name, password: password.value }), {
      CONFLICT: "That username is taken.",
      INVALID_REQUEST: "That username or password doesn't follow the rules under each box.",
    });
  } else {
    await enter(api.auth.login({ username: name, password: password.value }), {
      UNAUTHORIZED: "The username or password is incorrect.",
    });
  }
  working.value = false;
}

function switchMode() {
  creating.value = !creating.value;
  error.value = null;
}
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <label>
      Username
      <input
        v-model="username"
        autocomplete="username"
        autocapitalize="off"
        spellcheck="false"
        required
        :pattern="creating ? '[A-Za-z0-9_\\-]{3,32}' : undefined"
      />
      <span v-if="creating" class="hint">3 to 32 letters, digits, _ or -</span>
    </label>
    <label>
      Password
      <input
        v-model="password"
        type="password"
        :autocomplete="creating ? 'new-password' : 'current-password'"
        required
        :minlength="creating ? 8 : undefined"
      />
      <span v-if="creating" class="hint">8 to 128 characters</span>
    </label>
    <button type="submit" class="primary" :disabled="working">{{ words.action }}</button>
    <p class="switch">
      {{ words.other }}
      <button type="button" class="link" @click="switchMode">{{ words.switchTo }}</button>
    </p>
  </form>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 14px; }
label { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
input {
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid #d6d3d1;
  border-radius: 10px;
}
.hint, .switch { color: #78716c; font-size: 0.85rem; }
.switch { text-align: center; margin: 0; }
.error { margin: 0; color: #9f1239; }
.primary, .link { cursor: pointer; }
.primary {
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: #1c1917;
  color: #fafaf9;
}
.link { border: 0; background: none; color: #1c1917; text-decoration: underline; }
</style>
