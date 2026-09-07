import { useState } from 'react'
import { changelog, sections } from '../content'

export function ArticlePage() {
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('bug')

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
          {section.id === 'routing' && (
            <blockquote>
              <p>The pick survives the route change. The element it points at does not.</p>
            </blockquote>
          )}
        </section>
      ))}

      <h2>Changelog</h2>
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Date</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {changelog.map((entry) => (
            <tr key={entry.version}>
              <td>{entry.version}</td>
              <td>{entry.date}</td>
              <td>{entry.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Report something</h2>
      <p>A form, for picking inputs, labels and selects rather than only text and boxes.</p>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="topic">Topic</label>
          <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="bug">Bug</option>
            <option value="idea">Idea</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="details">Details</label>
          <textarea id="details" placeholder="What happened?" />
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="cta" type="submit">
            Send
          </button>
          <button className="ghost" type="reset">
            Reset
          </button>
        </div>
      </form>
    </main>
  )
}
