<script setup lang="ts">
import { onMounted, ref } from "vue";
import CommonsButton from "./components/CommonsButton.vue";
import CommonsCallback from "./components/CommonsCallback.vue";
import PasswordForm from "./components/PasswordForm.vue";
import DrawingWorkspace from "./components/DrawingWorkspace.vue";
import TimelapseGallery from "./components/TimelapseGallery.vue";
import CommunityFeed from "./components/CommunityFeed.vue";
import { useSession } from "./composables/useSession.ts";

const { me, checked, load, signOut } = useSession();
const returningFromCommons = ref(window.location.pathname === "/auth/commons/callback");
const screen = ref<"home" | "canvas" | "timelapses" | "community">("home");

onMounted(() => {
  if (!returningFromCommons.value) void load();
});

function finishedCommons() {
  returningFromCommons.value = false;
  if (!checked.value) void load();
}

async function leave() {
  await signOut();
  screen.value = "home";
}
</script>

<template>
  <DrawingWorkspace v-if="me && screen === 'canvas' && !returningFromCommons" :key="me.username" :username="me.username" @sign-out="leave" @timelapses="screen = 'timelapses'" @home="screen = 'home'" />
  <TimelapseGallery v-else-if="me && screen === 'timelapses' && !returningFromCommons" :key="me.username" :username="me.username" @practice="screen = 'canvas'" @home="screen = 'home'" @community="screen = 'community'" />
  <CommunityFeed v-else-if="me && screen === 'community' && !returningFromCommons" :key="me.username" :username="me.username" @practice="screen = 'canvas'" @home="screen = 'home'" @timelapses="screen = 'timelapses'" />
  <main v-else class="page">
    <CommonsCallback v-if="returningFromCommons" @done="finishedCommons" />
    <section v-else-if="me" class="card">
      <p class="eyebrow">Redraw</p>
      <h1>Signed in</h1>
      <p>You are <strong>{{ me.username }}</strong>.</p>
      <button type="button" class="primary" @click="screen = 'canvas'">Start Daily Practice</button>
      <button type="button" class="primary" @click="screen = 'timelapses'">View saved timelapses</button>
      <button type="button" class="primary" @click="screen = 'community'">Browse community</button>
      <button type="button" class="primary" @click="leave">Sign out</button>
    </section>
    <section v-else-if="checked" class="card">
      <p class="eyebrow">Redraw</p>
      <h1>Sign in</h1>
      <p class="lead">A space to draw, explore, and return to. Sign in to your private canvas.</p>
      <CommonsButton />
      <p class="or">or with a password</p>
      <PasswordForm />
    </section>
  </main>
</template>

<style scoped>
.page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
}
.card {
  width: min(100%, 400px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(28, 25, 23, 0.08);
}
.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #78716c;
}
h1 { margin: 0; font-size: 1.6rem; }
.lead, .or { margin: 0; color: #57534e; }
.or { text-align: center; }
.primary {
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: #1c1917;
  color: #fafaf9;
  cursor: pointer;
}
</style>
