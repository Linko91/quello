<script setup lang="ts">
import SiteNav from './components/SiteNav.vue'
</script>

<template>
  <SiteNav />
  <RouterView />
  <footer class="site-footer">
    quello · Vue playground — three routes, all of them longer than the viewport.
  </footer>
</template>
