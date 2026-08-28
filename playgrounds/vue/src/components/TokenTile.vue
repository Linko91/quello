<script setup lang="ts">
const props = defineProps<{ name: string; group: string; hue: number }>()
</script>

<template>
  <article class="tile">
    <div class="swatch" :style="{ background: `hsl(${props.hue} 55% 42%)` }" />
    <div class="body">
      <h3>{{ name }}</h3>
      <p>{{ group }}</p>
    </div>
  </article>
</template>
