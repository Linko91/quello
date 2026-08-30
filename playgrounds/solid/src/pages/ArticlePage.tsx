import { createSignal, For, Show } from 'solid-js'
import { changelog, sections } from '../content'

export function ArticlePage() {
  const [email, setEmail] = createSignal('')

  return (
    <main class="page">
      <header class="hero">
        <h1>A long page, on purpose</h1>
        <p class="lead">
          Everything below is here so there is something to scroll past. Pick an element near the
          top, scroll to the bottom, and check that the badge is still where you left it.
        </p>
      </header>

      <For each={sections}>
        {(section) => (
          <section id={`a-${section.id}`}>
            <h2>{section.title}</h2>
            <For each={section.paragraphs}>{(paragraph) => <p>{paragraph}</p>}</For>
            <Show when={section.id === 'routing'}>
              <blockquote>
                <p>The pick survives the route change. The element it points at does not.</p>
              </blockquote>
            </Show>
          </section>
        )}
      </For>

      <h2>Changelog</h2>
      <table>
        <thead>
          <tr><th>Version</th><th>Date</th><th>Note</th></tr>
        </thead>
        <tbody>
          <For each={changelog}>
            {(entry) => (
              <tr><td>{entry.version}</td><td>{entry.date}</td><td>{entry.note}</td></tr>
            )}
          </For>
        </tbody>
      </table>

      <h2>Report something</h2>
      <form class="form" onSubmit={(e) => e.preventDefault()}>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" value={email()} placeholder="you@example.com"
                 onInput={(e) => setEmail(e.currentTarget.value)} />
        </div>
        <div class="field">
          <label for="topic">Topic</label>
          <select id="topic"><option>Bug</option><option>Idea</option></select>
        </div>
        <div class="actions" style={{ 'margin-top': 0 }}>
          <button class="cta" type="submit">Send</button>
        </div>
      </form>
    </main>
  )
}
