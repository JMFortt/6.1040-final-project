<script setup lang="ts">
import { onMounted } from "vue";
import { useCoverage } from "../composables/useCoverage.ts";

const { rows, loading, error, max, neglected, practicedAny, load } = useCoverage();
onMounted(load);

const list = (names: string[]) => names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
</script>

<template>
  <section class="coverage" aria-labelledby="coverage-title">
    <div class="head">
      <h2 id="coverage-title" class="label">Fundamentals</h2>
    </div>
    <p v-if="loading && !rows.length" role="status" class="status">Loading…</p>
    <p v-else-if="error" class="error" role="alert">{{ error }} <button class="retry" @click="load">Retry</button></p>
    <template v-else>
      <ul>
        <li v-for="row in rows" :key="row.fundamental" :class="{ low: neglected.includes(row.fundamental) }">
          <span class="name">{{ row.fundamental }}</span>
          <span class="bar" aria-hidden="true"><span :style="{ width: `${(row.count / max) * 100}%` }" /></span>
          <span class="count">{{ row.count }}<span class="visually-hidden"> artwork{{ row.count === 1 ? "" : "s" }}</span></span>
        </li>
      </ul>
      <p v-if="!practicedAny" class="hint">Save an artwork to count your first practice.</p>
      <p v-else-if="neglected.length" class="hint">Least practiced: <strong>{{ list(neglected) }}</strong></p>
    </template>
  </section>
</template>

<style scoped>
.coverage { padding: 20px 24px; background: white; border: 1px solid #dfe2d8; border-radius: 16px; display: grid; gap: 12px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.label { margin: 0; font-family: Georgia, serif; font-weight: 400; font-size: 20px; color: #27372d; }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
li { display: grid; grid-template-columns: 92px minmax(60px, 1fr) 24px; align-items: center; gap: 10px; font-size: 13px; }
.name { text-transform: capitalize; color: #27372d; }
.bar { height: 8px; border-radius: 999px; background: #eef0e9; overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: inherit; background: #8e9d7f; }
.low .name { font-weight: 600; }
.low .bar span { background: #be7256; }
.count { text-align: right; font-variant-numeric: tabular-nums; color: #57605a; }
.hint { margin: 0; font-size: 12px; color: #70776e; }
.hint strong { color: #27372d; font-weight: 600; }
.status { margin: 0; color: #70776e; font-size: 13px; }
.error { margin: 0; color: #88492d; font-size: 13px; }
button { font: inherit; cursor: pointer; border: 1px solid #d5dcc7; border-radius: 8px; background: white; color: inherit; padding: 6px 12px; font-size: 12px; }
button:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
