<script lang="ts">
  import TokenTile from '../components/TokenTile.svelte'
  import { groups, tiles } from '../content'

  let active = $state<(typeof groups)[number]>('all')
  const shown = $derived(active === 'all' ? tiles : tiles.filter((t) => t.group === active))
</script>

<main class="page">
  <header class="hero">
    <h1>Gallery</h1>
    <p class="lead">
      {tiles.length} near-identical tiles. They share a tag and a class, so a selector has to fall
      back on position to tell one from another.
    </p>
  </header>

  <div class="filters">
    {#each groups as group (group)}
      <button class={active === group ? 'on' : ''} onclick={() => (active = group)}>{group}</button>
    {/each}
  </div>

  <section class="grid">
    {#each shown as tile (tile.id)}
      <TokenTile name={tile.name} group={tile.group} hue={tile.hue} />
    {/each}
  </section>

  <h2>Why this page exists</h2>
  <p>
    Filtering removes tiles from the DOM. A pick made on a tile that is later filtered out keeps its
    entry, but the element it points at is gone — the badge hides itself rather than drawing at the
    origin.
  </p>
  <p>
    Reset the filter and the tile comes back, though as a different element instance. This is the
    same situation as leaving and re-entering a route, only faster to reproduce.
  </p>
</main>
