/** The same content as the framework playgrounds, as plain data. */
export const features = [
  { title: 'Unique selectors', body: 'Every pick carries a CSS selector that resolves to exactly one element.', tag: 'core' },
  { title: 'Component names', body: 'Vue, React and Svelte internals are read to name the owning component.', tag: 'core' },
  { title: 'Source files', body: 'Where the framework exposes it, the pick points at a file and a line.', tag: 'core' },
  { title: 'Computed style', body: 'Font, colour, spacing and radius as the browser actually renders them.', tag: 'detail' },
  { title: 'Attributes', body: 'Every attribute as written in the markup, values truncated.', tag: 'detail' },
  { title: 'Markup', body: 'Optional outerHTML, whole or elided in the middle to a budget.', tag: 'detail' },
  { title: 'Clipboard', body: 'Mirror each selection to the clipboard, alone or with the whole list.', tag: 'flow' },
  { title: 'Persistence', body: 'Picks are written to .quello/picks.json by the quello CLI.', tag: 'flow' },
  { title: 'Reload safe', body: 'Badges are re-attached after a reload by re-resolving each selector.', tag: 'flow' },
]

export const sections = [
  {
    id: 'scrolling',
    title: 'Scrolling',
    paragraphs: [
      'Badges are anchored to their elements on every animation frame, so they track the page as it scrolls rather than drifting away from what they label.',
      'This page is deliberately long. Scroll to the bottom with a pick made near the top, then scroll back, and the badge should still sit on the same element.',
    ],
  },
  {
    id: 'no-framework',
    title: 'No framework',
    paragraphs: [
      'Nothing here is compiled. There is no bundler, no framework and no build step — three HTML files, one stylesheet and a little JavaScript.',
      'So a pick carries no component name: the selector, the DOM path and the text are all it has, which is the case worth proving works.',
    ],
  },
  {
    id: 'the-cli',
    title: 'The CLI',
    paragraphs: [
      'quello runs beside the page rather than inside a build. The CLI serves these files, answers the picks endpoint and writes .quello/picks.json.',
      'The same command works against a project served by anything else — point the script tag at the CLI and leave your own server alone.',
    ],
  },
]

export const tiles = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  name: `Token ${String(i + 1).padStart(2, '0')}`,
  group: ['layout', 'typography', 'colour', 'motion'][i % 4],
  hue: (i * 37) % 360,
}))

export const changelog = [
  { version: '0.1.0', date: '2026-08-28', note: 'First cut: picker, overlay, Vite plugin.' },
  { version: '0.1.6', date: '2026-08-28', note: 'Copy to clipboard on pick.' },
  { version: '0.1.7', date: '2026-08-30', note: 'Shared server package, webpack plugin and CLI.' },
]
