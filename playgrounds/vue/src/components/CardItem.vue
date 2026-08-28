<script setup lang="ts">
defineProps<{ title: string; body: string }>()
</script>

<template>
  <article class="card">
    <h3>{{ title }}</h3>
    <p>{{ body }}</p>
  </article>
</template>
