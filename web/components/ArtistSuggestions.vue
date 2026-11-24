<script setup lang="ts">
import { useFollowing } from "../composables/useFollowing.ts";
import ArtistAvatar from "./ArtistAvatar.vue";

/** Artists to follow: a compact sidebar list, or large cards for an empty feed. */
const props = defineProps<{ variant: "list" | "cards"; limit?: number }>();
const { suggestions, loaded, isFollowing, isPending, toggle } = useFollowing();
const shown = () => suggestions.value.slice(0, props.limit ?? 5);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
</script>

<template>
  <ul v-if="shown().length" :class="variant">
    <li v-for="artist in shown()" :key="artist.username">
      <ArtistAvatar :username="artist.username" :size="variant === 'cards' ? 56 : 36" />
      <div class="who">
        <strong>{{ artist.username }}</strong>
        <span>{{ plural(artist.posts, "artwork") }} · {{ plural(artist.followers, "follower") }}</span>
      </div>
      <button class="follow" :class="{ on: isFollowing(artist.username) }" :disabled="isPending(artist.username)" :aria-pressed="isFollowing(artist.username)" @click="toggle(artist.username)">
        {{ isFollowing(artist.username) ? "Following" : "Follow" }}
      </button>
    </li>
  </ul>
  <p v-else-if="loaded" class="none">No artists available.</p>
</template>

<style scoped>
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
li { display: flex; align-items: center; gap: 12px; min-width: 0; }
.who { display: grid; gap: 3px; min-width: 0; flex: 1; }
.who strong { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.who span { font-size: 11px; color: #70776e; }
.cards { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.cards li { flex-direction: column; text-align: center; padding: 22px 16px; background: white; border: 1px solid #dfe2d8; border-radius: 14px; }
.cards .who { justify-items: center; }
.follow { font: inherit; font-size: 13px; cursor: pointer; border: 1px solid #465a3d; border-radius: 999px; background: #465a3d; color: white; padding: 6px 16px; min-height: 36px; }
.follow.on { background: white; color: #465a3d; }
.follow:disabled { opacity: 0.6; cursor: progress; }
.follow:focus-visible { outline: 2px solid #567b8a; outline-offset: 3px; }
.none { font-size: 13px; color: #70776e; margin: 0; }
</style>
