import { createMemo, createSignal, For } from 'solid-js'
import { TokenTile } from '../components/TokenTile'
import { groups, tiles } from '../content'

export function GalleryPage() {
  const [active, setActive] = createSignal<(typeof groups)[number]>('all')
  const shown = createMemo(() =>
    active() === 'all' ? tiles : tiles.filter((t) => t.group === active()),
  )

  return (
    <main class="page">
      <header class="hero">
        <h1>Gallery</h1>
        <p class="lead">
          {tiles.length} near-identical tiles. They share a tag and a class, so a selector has to
          fall back on position to tell one from another.
        </p>
      </header>

      <div class="filters">
        <For each={groups}>
          {(group) => (
            <button class={active() === group ? 'on' : ''} onClick={() => setActive(group)}>
              {group}
            </button>
          )}
        </For>
      </div>

      <section class="grid">
        <For each={shown()}>
          {(tile) => <TokenTile name={tile.name} group={tile.group} hue={tile.hue} />}
        </For>
      </section>

      <h2>Why this page exists</h2>
      <p>Filtering removes tiles from the DOM, so a pick can lose the element it points at.</p>
    </main>
  )
}
