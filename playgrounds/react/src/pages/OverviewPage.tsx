import { useState } from 'react'
import { FeatureCard } from '../components/FeatureCard'
import { features, sections } from '../content'

export function OverviewPage() {
  const [clicks, setClicks] = useState(0)

  return (
    <main className="page">
      <header className="hero">
        <h1>Point at it, then say "quello"</h1>
        <p className="lead">
          A visual element picker for AI coding agents. Toggle picker mode with <code>Alt+Q</code>,
          click anything, and the pick lands in <code>.quello/picks.json</code>.
        </p>
        <div className="badge-row">
          <span className="pill">React 18</span>
          <span className="pill">react-router</span>
          <span className="pill">3 routes</span>
          <span className="pill">sticky nav + rail</span>
        </div>
        <div className="actions">
          <button className="cta" onClick={() => setClicks((n) => n + 1)}>
            Clicked {clicks} times
          </button>
          <button className="ghost">Secondary action</button>
        </div>
      </header>

      <h2>What a pick carries</h2>
      <section className="grid">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <div className="split" style={{ marginTop: 48 }}>
        <aside className="rail">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </aside>
        <div>
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 style={{ marginTop: 0 }}>{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
