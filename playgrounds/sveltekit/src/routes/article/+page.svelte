<script lang="ts">
  import { changelog, sections } from '$lib/content'
  let email = $state('')
</script>

<svelte:head><title>Article · quello SvelteKit playground</title></svelte:head>

<main class="page">
  <header class="hero">
    <h1>A long page, on purpose</h1>
    <p class="lead">Scroll past all of this with a pick made at the top.</p>
  </header>

  {#each sections as section (section.id)}
    <section id={`a-${section.id}`}>
      <h2>{section.title}</h2>
      {#each section.paragraphs as paragraph}<p>{paragraph}</p>{/each}
    </section>
  {/each}

  <h2>Changelog</h2>
  <table>
    <thead><tr><th>Version</th><th>Date</th><th>Note</th></tr></thead>
    <tbody>
      {#each changelog as entry (entry.version)}
        <tr><td>{entry.version}</td><td>{entry.date}</td><td>{entry.note}</td></tr>
      {/each}
    </tbody>
  </table>

  <h2>Report something</h2>
  <form class="form" onsubmit={(e) => e.preventDefault()}>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} placeholder="you@example.com" />
    </div>
    <div class="actions" style="margin-top: 0"><button class="cta" type="submit">Send</button></div>
  </form>
</main>
