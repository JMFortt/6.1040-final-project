<script setup lang="ts">
import { ref } from "vue";
import { api } from "../client.ts";
import CommonsMark from "./CommonsMark.vue";
import { useSession } from "../composables/useSession.ts";

const { error } = useSession();
const working = ref(false);

async function start() {
  working.value = true;
  const result = await api.auth.commons.start();
  if ("error" in result) {
    error.value = "Commons sign-in isn't available right now. Try again.";
    working.value = false;
    return;
  }
  window.location.assign(result.address);
}
</script>

<template>
  <button type="button" class="commons" :disabled="working" @click="start">
    <CommonsMark :size="26" />
    {{ working ? "Opening Commons…" : "Sign in with Commons" }}
  </button>
</template>

<style scoped>
.commons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  border: 0;
  border-radius: 10px;
  background: #b44900;
  color: #fefcf4;
  font-weight: 700;
  cursor: pointer;
}
</style>
