<script lang="ts">
  import { router } from '../router.svelte'

  const links = [
    { to: '/', label: 'Overview' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/article', label: 'Article' },
  ]

  function navigate(event: MouseEvent, to: string) {
    event.preventDefault()
    router.go(to)
  }
</script>

<nav class="site-nav">
  <span class="brand">quello</span>
  {#each links as link (link.to)}
    <a
      href={link.to}
      class={router.path === link.to ? 'active' : ''}
      onclick={(e) => navigate(e, link.to)}
    >
      {link.label}
    </a>
  {/each}
  <span class="spacer"></span>
  <span class="hint">Alt+Q to pick</span>
</nav>
