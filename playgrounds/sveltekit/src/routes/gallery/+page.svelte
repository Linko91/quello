<script lang="ts">
  import { groups, tiles } from '$lib/content'
  let active = $state<(typeof groups)[number]>('all')
  const shown = $derived(active === 'all' ? tiles : tiles.filter((t) => t.group === active))
</script>

<svelte:head><title>Gallery · quello SvelteKit playground</title></svelte:head>

<main class="page">
  <header class="hero">
    <h1>Gallery</h1>
    <p class="lead">{tiles.length} near-identical tiles, told apart only by position.</p>
  </header>
  <div class="filters">
    {#each groups as group (group)}
      <button class={active === group ? 'on' : ''} onclick={() => (active = group)}>{group}</button>
    {/each}
  </div>
  <section class="grid">
    {#each shown as tile (tile.id)}
      <article class="tile">
        <div class="swatch" style="background: hsl({tile.hue} 55% 42%)"></div>
        <div class="body"><h3>{tile.name}</h3><p>{tile.group}</p></div>
      </article>
    {/each}
  </section>
</main>
