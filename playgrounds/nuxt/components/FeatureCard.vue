<script setup lang="ts">
defineProps<{ title: string; body: string; tag: string }>()
</script>

<template>
  <article class="card">
    <h3>{{ title }}</h3>
    <p>{{ body }}</p>
    <span class="tag">{{ tag }}</span>
  </article>
</template>
