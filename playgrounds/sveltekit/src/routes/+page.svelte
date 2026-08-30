<script lang="ts">
  import { features, sections } from '$lib/content'
  let clicks = $state(0)
</script>

<svelte:head><title>Overview · quello SvelteKit playground</title></svelte:head>

<main class="page">
  <header class="hero">
    <h1>Point at it, then say "quello"</h1>
    <p class="lead">
      SvelteKit renders this document on the server, so quello arrives through
      <code>virtual:quello</code> rather than an injected script tag.
    </p>
    <div class="badge-row">
      <span class="pill">SvelteKit 2</span>
      <span class="pill">SSR</span>
      <span class="pill">3 routes</span>
      <span class="pill">sticky nav + rail</span>
    </div>
    <div class="actions">
      <button class="cta" onclick={() => clicks++}>Clicked {clicks} times</button>
      <button class="ghost">Secondary action</button>
    </div>
  </header>

  <h2>What a pick carries</h2>
  <section class="grid">
    {#each features as feature (feature.title)}
      <article class="card">
        <h3>{feature.title}</h3>
        <p>{feature.body}</p>
        <span class="tag">{feature.tag}</span>
      </article>
    {/each}
  </section>

  <div class="split" style="margin-top: 48px">
    <aside class="rail">
      {#each sections as section (section.id)}<a href={`#${section.id}`}>{section.title}</a>{/each}
    </aside>
    <div>
      {#each sections as section (section.id)}
        <section id={section.id}>
          <h2 style="margin-top: 0">{section.title}</h2>
          {#each section.paragraphs as paragraph}<p>{paragraph}</p>{/each}
        </section>
      {/each}
    </div>
  </div>
</main>
