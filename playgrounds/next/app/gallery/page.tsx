'use client'

import { useState } from 'react'
import { groups, tiles } from '../../content'

export default function GalleryPage() {
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
          <article className="tile" key={tile.id}>
            <div className="swatch" style={{ background: `hsl(${tile.hue} 55% 42%)` }} />
            <div className="body">
              <h3>{tile.name}</h3>
              <p>{tile.group}</p>
            </div>
          </article>
        ))}
      </section>

      <h2>Why this page exists</h2>
      <p>Filtering removes tiles from the DOM, so a pick can lose the element it points at.</p>
    </main>
  )
}
