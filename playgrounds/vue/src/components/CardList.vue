<script setup lang="ts">
import CardItem from './CardItem.vue'

const cards = [
  { title: 'Selector', body: 'Unique CSS selector for every pick.' },
  { title: 'Component', body: 'Vue component name and source file.' },
  { title: 'Persistence', body: 'Written to .quello/picks.json by the dev server.' },
]
</script>

<template>
  <section class="card-list">
    <CardItem v-for="card in cards" :key="card.title" :title="card.title" :body="card.body" />
  </section>
</template>
