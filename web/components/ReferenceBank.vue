<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "../client.ts";

const props = defineProps<{ username: string }>();
const emit = defineEmits<{ claimed: []; denied: [] }>();

/** Fundamentals a curator can attach. */
const FUNDAMENTALS = ["anatomy", "color", "form", "lighting", "perspective"] as const;
const label = (tag: string) => tag.slice(0, 1).toUpperCase() + tag.slice(1);

interface Photo { image: string; source: string; credit: string; tags: string[] }

const photos = ref<Photo[]>([]);
const curator = ref(false);
const loading = ref(true);
const loadError = ref("");
const notice = ref("");
const source = ref("");
const credit = ref("");
const selected = ref<string[]>([]);
const saving = ref(false);
const appointName = ref("");
const busy = ref("");

function explain(error: string) {
  if (error === "UNAUTHORIZED") return "Your session ended. Sign in again.";
  if (error === "FORBIDDEN") return "Only a curator can change the reference bank.";
  if (error === "CONFLICT") return "This reference is already in the bank.";
  if (error === "NOT_FOUND") return "That reference is not in the bank.";
  if (error === "INVALID_REQUEST") return "Check the image address, the credit, and that one to eight fundamentals are selected.";
  return "Something went wrong. Try again.";
}

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    const result = await api.references.catalog();
    if ("error" in result) {
      if (result.error === "FORBIDDEN") {
        curator.value = false;
        photos.value = [];
        return;
      }
      loadError.value = explain(result.error);
      return;
    }
    curator.value = true;
    photos.value = result.images.map((photo) => ({
      ...photo,
      tags: photo.tags.filter((tag) => (FUNDAMENTALS as readonly string[]).includes(tag)),
    }));
  } catch {
    loadError.value = "Could not load the reference bank.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function become() {
  notice.value = "";
  const result = await api.references.appoint({ username: props.username });
  if ("error" in result) {
    if (result.error === "FORBIDDEN") emit("denied");
    else notice.value = explain(result.error);
    return;
  }
  emit("claimed");
  await load();
}

function toggle(tag: string) {
  selected.value = selected.value.includes(tag) ? selected.value.filter((item) => item !== tag) : [...selected.value, tag];
}

async function addPhoto() {
  notice.value = "";
  saving.value = true;
  try {
    const result = await api.references.add({
      key: crypto.randomUUID(),
      source: source.value,
      credit: credit.value,
      tags: selected.value,
    });
    if ("error" in result) {
      notice.value = explain(result.error);
      return;
    }
    source.value = "";
    credit.value = "";
    selected.value = [];
    await load();
  } finally {
    saving.value = false;
  }
}

async function retag(photo: Photo, tag: string) {
  notice.value = "";
  const tags = photo.tags.includes(tag) ? photo.tags.filter((item) => item !== tag) : [...photo.tags, tag];
  if (tags.length === 0) {
    notice.value = "A reference needs at least one fundamental.";
    return;
  }
  busy.value = photo.image;
  try {
    const result = await api.references.tag({ image: photo.image, tags });
    if ("error" in result) notice.value = explain(result.error);
    await load();
  } finally {
    busy.value = "";
  }
}

async function remove(photo: Photo) {
  notice.value = "";
  if (!window.confirm("Remove this reference from the bank?")) return;
  busy.value = photo.image;
  try {
    const result = await api.references.remove({ image: photo.image });
    if ("error" in result) notice.value = explain(result.error);
    await load();
  } finally {
    busy.value = "";
  }
}

async function appointOther() {
  notice.value = "";
  const result = await api.references.appoint({ username: appointName.value.trim() });
  if ("error" in result) {
    notice.value = result.error === "NOT_FOUND" ? "No one is registered under that username."
      : result.error === "CONFLICT" ? "This person is already a curator."
      : explain(result.error);
    return;
  }
  appointName.value = "";
  notice.value = "Appointed.";
}
</script>

<template>
  <main class="bank">
    <div class="sheet">
      <header class="heading">
        <h1>Reference bank</h1>
        <p>Add a photo, name who made it, and choose the fundamentals it is for. Every artist who practices one of those fundamentals can be given that photo.</p>
      </header>

      <p v-if="loading" class="status">Loading the bank…</p>
      <p v-else-if="loadError" class="error" role="alert">{{ loadError }} <button class="quiet" @click="load">Retry</button></p>

      <section v-else-if="!curator" class="card gate">
        <h2>Curators change the bank</h2>
        <p>The first curator is whoever takes the role. After that, a curator appoints the next person.</p>
        <button class="primary" @click="become">Become the curator</button>
        <p v-if="notice" class="error" role="alert">{{ notice }}</p>
      </section>

      <template v-else>
        <p v-if="notice" class="error" role="alert">{{ notice }}</p>

        <form class="card appoint" @submit.prevent="appointOther">
          <h2>Appoint a curator</h2>
          <label>Username <input v-model="appointName" type="text" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_-]{3,32}" autocomplete="off" /></label>
          <button class="primary" type="submit">Appoint</button>
        </form>

        <form class="card" @submit.prevent="addPhoto">
          <h2>Add a photo</h2>
          <label>Image address <input v-model="source" type="url" required maxlength="2048" placeholder="https://…" autocomplete="off" /></label>
          <p class="hint">Use the direct image address. On Wikimedia Commons, copy the address from “Use this file”, not the wiki page.</p>
          <label>Credit <input v-model="credit" type="text" required maxlength="300" placeholder="Author, CC BY-SA 4.0" autocomplete="off" /></label>
          <fieldset>
            <legend>Fundamentals</legend>
            <label v-for="tag in FUNDAMENTALS" :key="tag" class="check"><input type="checkbox" :checked="selected.includes(tag)" @change="toggle(tag)" /> {{ label(tag) }}</label>
          </fieldset>
          <button class="primary" type="submit" :disabled="saving || selected.length === 0">{{ saving ? "Adding…" : "Add to the bank" }}</button>
        </form>

        <section class="photos" aria-label="Photos in the bank">
          <p v-if="photos.length === 0" class="status">The bank is empty. Add a photo so artists have something to draw from.</p>
          <article v-for="photo in photos" :key="photo.image" class="card photo">
            <img :src="photo.source" :alt="photo.credit" />
            <div class="meta">
              <p class="credit">{{ photo.credit }}</p>
              <p class="address">{{ photo.source }}</p>
              <fieldset :disabled="busy === photo.image">
                <legend class="visually-hidden">Fundamentals for this photo</legend>
                <label v-for="tag in FUNDAMENTALS" :key="tag" class="check"><input type="checkbox" :checked="photo.tags.includes(tag)" @change="retag(photo, tag)" /> {{ label(tag) }}</label>
              </fieldset>
              <button class="quiet danger" type="button" :disabled="busy === photo.image" @click="remove(photo)">Remove</button>
            </div>
          </article>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.bank { display: flex; justify-content: center; min-height: calc(100dvh - 65px); padding: 28px 20px 48px; background: #f3f5ee; color: #27372d; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
.sheet { width: min(100%, 980px); }
.heading { max-width: 68ch; margin: 0 auto 24px; text-align: center; }
h1 { margin: 0 0 8px; font-size: 1.8rem; }
h2 { margin: 0; font-size: 1.05rem; }
p { margin: 0; }
.heading p, .hint, .address { color: #57605a; }
.hint, .address { font-size: 13px; }
.card { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; padding: 18px; background: white; border: 1px solid #dfe2d8; border-radius: 12px; }
label, .check { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.check { flex-direction: row; align-items: center; }
fieldset { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0; padding: 0; border: 0; }
input[type="text"], input[type="url"] { font: inherit; padding: 8px 10px; border: 1px solid #d5dcc7; border-radius: 8px; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 8px 14px; min-height: 40px; }
button:disabled { cursor: not-allowed; opacity: 0.55; }
button:focus-visible, input:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.primary { align-self: start; background: #465a3d; color: white; border-color: #465a3d; }
.quiet { background: none; }
.danger { align-self: start; color: #8a3d3d; }
.status { color: #57605a; text-align: center; }
.error { color: #8a3d3d; text-align: center; }
.photos { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.photos > .status { grid-column: 1 / -1; }
.photo { margin-bottom: 0; }
.photo img { width: 100%; height: 200px; object-fit: contain; background: #f3f5ee; border-radius: 8px; }
.meta { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.credit { font-weight: 600; }
.address { overflow-wrap: anywhere; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
@media (max-width: 760px) {
  .bank { padding: 16px; }
  .photos { grid-template-columns: 1fr; }
}
</style>
