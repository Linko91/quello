<script lang="ts">
  import { onMount } from 'svelte'
  import { dev } from '$app/environment'
  import { page } from '$app/state'
  import '$lib/style.css'

  let { children } = $props()

  // SvelteKit renders its own document, so the plugin's script tag never lands.
  // The virtual module carries the same options an injected tag would have.
  onMount(() => {
    if (dev) import('virtual:quello')
  })

  const links = [
    { to: '/', label: 'Overview' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/article', label: 'Article' },
  ]
</script>

<nav class="site-nav">
  <span class="brand">quello</span>
  {#each links as link (link.to)}
    <a href={link.to} class={page.url.pathname === link.to ? 'active' : ''}>{link.label}</a>
  {/each}
  <span class="spacer"></span>
  <span class="hint">Alt+Q to pick</span>
</nav>

{@render children()}

<footer class="site-footer">
  quello · SvelteKit playground — three routes, all of them longer than the viewport.
</footer>
