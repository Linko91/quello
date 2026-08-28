<script setup lang="ts">
import { ref } from 'vue'
import CardList from './components/CardList.vue'

const clicks = ref(0)
</script>

<template>
  <main class="page">
    <h1>quello · Vue playground</h1>
    <p class="hint">
      Hit <strong>Alt+Q</strong> (or the button, bottom right) to start picking, then click any
      element. Picks land in <code>.quello/picks.json</code>.
    </p>
    <CardList />
    <button class="cta" @click="clicks++">Clicked {{ clicks }} times</button>
  </main>
</template>
