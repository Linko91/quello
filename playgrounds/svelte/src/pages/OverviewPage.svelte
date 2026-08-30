<script lang="ts">
  import FeatureCard from '../components/FeatureCard.svelte'
  import { features, sections } from '../content'

  let clicks = $state(0)
</script>

<main class="page">
  <header class="hero">
    <h1>Point at it, then say "quello"</h1>
    <p class="lead">
      A visual element picker for AI coding agents. Toggle picker mode with <code>Alt+Q</code>,
      click anything, and the pick lands in <code>.quello/picks.json</code>.
    </p>
    <div class="badge-row">
      <span class="pill">Svelte 5</span>
      <span class="pill">history router</span>
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
      <FeatureCard title={feature.title} body={feature.body} tag={feature.tag} />
    {/each}
  </section>

  <div class="split" style="margin-top: 48px">
    <aside class="rail">
      {#each sections as section (section.id)}
        <a href={`#${section.id}`}>{section.title}</a>
      {/each}
    </aside>
    <div>
      {#each sections as section (section.id)}
        <section id={section.id}>
          <h2 style="margin-top: 0">{section.title}</h2>
          {#each section.paragraphs as paragraph}
            <p>{paragraph}</p>
          {/each}
        </section>
      {/each}
    </div>
  </div>
</main>
