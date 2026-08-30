import { createSignal, For } from 'solid-js'
import { FeatureCard } from '../components/FeatureCard'
import { features, sections } from '../content'

export function OverviewPage() {
  const [clicks, setClicks] = createSignal(0)

  return (
    <main class="page">
      <header class="hero">
        <h1>Point at it, then say "quello"</h1>
        <p class="lead">
          A visual element picker for AI coding agents. Toggle picker mode with <code>Alt+Q</code>,
          click anything, and the pick lands in <code>.quello/picks.json</code>.
        </p>
        <div class="badge-row">
          <span class="pill">Solid 1.9</span>
          <span class="pill">@solidjs/router</span>
          <span class="pill">3 routes</span>
          <span class="pill">sticky nav + rail</span>
        </div>
        <div class="actions">
          <button class="cta" onClick={() => setClicks((n) => n + 1)}>
            Clicked {clicks()} times
          </button>
          <button class="ghost">Secondary action</button>
        </div>
      </header>

      <h2>What a pick carries</h2>
      <section class="grid">
        <For each={features}>
          {(feature) => <FeatureCard title={feature.title} body={feature.body} tag={feature.tag} />}
        </For>
      </section>

      <div class="split" style={{ 'margin-top': '48px' }}>
        <aside class="rail">
          <For each={sections}>{(section) => <a href={`#${section.id}`}>{section.title}</a>}</For>
        </aside>
        <div>
          <For each={sections}>
            {(section) => (
              <section id={section.id}>
                <h2 style={{ 'margin-top': 0 }}>{section.title}</h2>
                <For each={section.paragraphs}>{(paragraph) => <p>{paragraph}</p>}</For>
              </section>
            )}
          </For>
        </div>
      </div>
    </main>
  )
}
