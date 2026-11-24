<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppNav, { type Page } from "./components/AppNav.vue";
import CommonsButton from "./components/CommonsButton.vue";
import CommonsCallback from "./components/CommonsCallback.vue";
import CommunityPage from "./components/CommunityPage.vue";
import DrawingWorkspace from "./components/DrawingWorkspace.vue";
import HomeDashboard from "./components/HomeDashboard.vue";
import ReferenceBank from "./components/ReferenceBank.vue";
import PasswordForm from "./components/PasswordForm.vue";
import TimelapseGallery from "./components/TimelapseGallery.vue";
import WelcomeDialog from "./components/WelcomeDialog.vue";
import { api } from "./client.ts";
import { useSession } from "./composables/useSession.ts";

const { me, checked, load, signOut } = useSession();
const returningFromCommons = ref(window.location.pathname === "/auth/commons/callback");
const screen = ref<Page>("home");
/** Shown to a curator, and to everyone while the bank still has no curator. */
const references = ref(false);
const welcomeOpen = ref(false);
/** True while the canvas still has work that leaving would drop. */
const drawBusy = ref(false);

async function refreshReferences() {
  if (!me.value) {
    references.value = false;
    return;
  }
  const result = await api.references.access();
  references.value = !("error" in result) && (result.curator || result.vacant);
  if (!references.value && screen.value === "references") screen.value = "home";
}

onMounted(() => {
  if (!returningFromCommons.value) void load();
});

watch(me, () => { void refreshReferences(); });

function finishedCommons() {
  returningFromCommons.value = false;
  if (!checked.value) void load();
}

async function leave() {
  await signOut();
  screen.value = "home";
}

// Each page starts at its top. Leaving Draw clears the lock the canvas was holding.
// A solid cover hides the new page until Vue has painted it, then fades away. The nav sits above that cover.
const covered = ref(false);
let coverFrame = 0;
watch(screen, async (page) => {
  window.scrollTo(0, 0);
  if (page !== "draw") drawBusy.value = false;
  covered.value = true;
  cancelAnimationFrame(coverFrame);
  await nextTick();
  coverFrame = requestAnimationFrame(() => {
    coverFrame = requestAnimationFrame(() => { covered.value = false; });
  });
});
onBeforeUnmount(() => cancelAnimationFrame(coverFrame));

// The welcome opens once for each account on this browser, and again from Help.
// Remembering it in browser storage is a convenience: if storage is unavailable, it simply shows again.
const welcomedKey = (username: string) => `redraw:welcomed:${username}`;
watch(me, (person) => {
  welcomeOpen.value = false;
  if (!person) return;
  try { if (!localStorage.getItem(welcomedKey(person.username))) welcomeOpen.value = true; } catch { /* storage unavailable */ }
}, { immediate: true });

function closeWelcome() {
  welcomeOpen.value = false;
  if (me.value) try { localStorage.setItem(welcomedKey(me.value.username), "1"); } catch { /* storage unavailable */ }
}
</script>

<template>
  <template v-if="me && !returningFromCommons">
    <div class="app" :class="{ draw: screen === 'draw' }">
      <AppNav :current="screen" :username="me.username" :locked="drawBusy" :references="references" @navigate="screen = $event" @help="welcomeOpen = true" @sign-out="leave" />
      <div class="stage">
        <DrawingWorkspace v-if="screen === 'draw'" :key="me.username" @timelapses="screen = 'timelapses'" @busy="drawBusy = $event" />
        <HomeDashboard v-else-if="screen === 'home'" :key="me.username" :username="me.username" @practice="screen = 'draw'" @timelapses="screen = 'timelapses'" @artists="screen = 'community'" />
        <TimelapseGallery v-else-if="screen === 'timelapses'" :key="me.username" :username="me.username" @practice="screen = 'draw'" />
        <ReferenceBank v-else-if="screen === 'references'" :key="me.username" :username="me.username" @claimed="refreshReferences" @denied="refreshReferences" />
        <CommunityPage v-else :key="me.username" />
        <div class="veil" :class="{ shown: covered, draw: screen === 'draw' }" aria-hidden="true" />
      </div>
    </div>
    <WelcomeDialog :open="welcomeOpen" @close="closeWelcome" @practice="screen = 'draw'" />
  </template>
  <main v-else class="page">
    <CommonsCallback v-if="returningFromCommons" @done="finishedCommons" />
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
.app.draw { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
.stage { isolation: isolate; }
.app.draw .stage { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.veil { position: fixed; z-index: 40; inset: 0; background: #f3f5ee; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; }
.veil.draw { background: #f8f9f4; }
.veil.shown { opacity: 1; transition: none; }
@media (prefers-reduced-motion: reduce) { .veil { display: none; } }
@media (max-width: 760px) {
  .app.draw { height: auto; min-height: 100dvh; overflow: visible; }
}
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
</style>
