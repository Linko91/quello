<script setup lang="ts">
import { computed, ref } from 'vue'
import TokenTile from '../components/TokenTile.vue'
import { groups, tiles } from '../content'

const active = ref<(typeof groups)[number]>('all')
const shown = computed(() => (active.value === 'all' ? tiles : tiles.filter((t) => t.group === active.value)))
</script>

<template>
  <main class="page">
    <header class="hero">
      <h1>Gallery</h1>
      <p class="lead">
        {{ tiles.length }} near-identical tiles. They share a tag and a class, so a selector has to
        fall back on position to tell one from another.
      </p>
    </header>

    <div class="filters">
      <button
        v-for="group in groups"
        :key="group"
        :class="{ on: active === group }"
        @click="active = group"
      >
        {{ group }}
      </button>
    </div>

    <section class="grid">
      <TokenTile
        v-for="tile in shown"
        :key="tile.id"
        :name="tile.name"
        :group="tile.group"
        :hue="tile.hue"
      />
    </section>

    <h2>Why this page exists</h2>
    <p>
      Filtering removes tiles from the DOM. A pick made on a tile that is later filtered out keeps
      its entry, but the element it points at is gone — the badge hides itself rather than drawing
      at the origin.
    </p>
    <p>
      Reset the filter and the tile comes back, though as a different element instance. This is the
      same situation as leaving and re-entering a route, only faster to reproduce.
    </p>
  </main>
</template>
