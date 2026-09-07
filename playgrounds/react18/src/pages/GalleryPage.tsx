import { useState } from 'react'
import { TokenTile } from '../components/TokenTile'
import { groups, tiles } from '../content'

export function GalleryPage() {
  const [active, setActive] = useState<(typeof groups)[number]>('all')
  const shown = active === 'all' ? tiles : tiles.filter((t) => t.group === active)

  return (
    <main className="page">
      <header className="hero">
        <h1>Gallery</h1>
        <p className="lead">
          {tiles.length} near-identical tiles. They share a tag and a class, so a selector has to
          fall back on position to tell one from another.
        </p>
      </header>

      <div className="filters">
        {groups.map((group) => (
          <button key={group} className={active === group ? 'on' : ''} onClick={() => setActive(group)}>
            {group}
          </button>
        ))}
      </div>

      <section className="grid">
        {shown.map((tile) => (
          <TokenTile key={tile.id} name={tile.name} group={tile.group} hue={tile.hue} />
        ))}
      </section>

      <h2>Why this page exists</h2>
      <p>
        Filtering removes tiles from the DOM. A pick made on a tile that is later filtered out keeps
        its entry, but the element it points at is gone — the badge hides itself rather than drawing
        at the origin.
      </p>
      <p>
        Reset the filter and the tile comes back, though as a different element instance. This is the
        same situation as leaving and re-entering a route, only faster to reproduce.
      </p>
    </main>
  )
}
