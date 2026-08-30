'use client'

import { useState } from 'react'
import { changelog, sections } from '../../content'

export default function ArticlePage() {
  const [email, setEmail] = useState('')

  return (
    <main className="page">
      <header className="hero">
        <h1>A long page, on purpose</h1>
        <p className="lead">
          Everything below is here so there is something to scroll past. Pick an element near the
          top, scroll to the bottom, and check that the badge is still where you left it.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.id} id={`a-${section.id}`}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
      ))}

      <h2>Changelog</h2>
      <table>
        <thead>
          <tr><th>Version</th><th>Date</th><th>Note</th></tr>
        </thead>
        <tbody>
          {changelog.map((entry) => (
            <tr key={entry.version}>
              <td>{entry.version}</td><td>{entry.date}</td><td>{entry.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Report something</h2>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="cta" type="submit">Send</button>
        </div>
      </form>
    </main>
  )
}
