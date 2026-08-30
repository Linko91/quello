<script lang="ts">
  import { changelog, sections } from '../content'

  let email = $state('')
  let topic = $state('bug')
</script>

<main class="page">
  <header class="hero">
    <h1>A long page, on purpose</h1>
    <p class="lead">
      Everything below is here so there is something to scroll past. Pick an element near the top,
      scroll to the bottom, and check that the badge is still where you left it.
    </p>
  </header>

  {#each sections as section (section.id)}
    <section id={`a-${section.id}`}>
      <h2>{section.title}</h2>
      {#each section.paragraphs as paragraph}
        <p>{paragraph}</p>
      {/each}
      {#if section.id === 'routing'}
        <blockquote>
          <p>The pick survives the route change. The element it points at does not.</p>
        </blockquote>
      {/if}
    </section>
  {/each}

  <h2>Changelog</h2>
  <table>
    <thead>
      <tr><th>Version</th><th>Date</th><th>Note</th></tr>
    </thead>
    <tbody>
      {#each changelog as entry (entry.version)}
        <tr><td>{entry.version}</td><td>{entry.date}</td><td>{entry.note}</td></tr>
      {/each}
    </tbody>
  </table>

  <h2>Report something</h2>
  <p>A form, for picking inputs, labels and selects rather than only text and boxes.</p>
  <form class="form" onsubmit={(e) => e.preventDefault()}>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} placeholder="you@example.com" />
    </div>
    <div class="field">
      <label for="topic">Topic</label>
      <select id="topic" bind:value={topic}>
        <option value="bug">Bug</option>
        <option value="idea">Idea</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="field">
      <label for="details">Details</label>
      <textarea id="details" placeholder="What happened?"></textarea>
    </div>
    <div class="actions" style="margin-top: 0">
      <button class="cta" type="submit">Send</button>
      <button class="ghost" type="reset">Reset</button>
    </div>
  </form>
</main>
