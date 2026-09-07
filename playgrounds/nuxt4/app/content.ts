/** Content for the playground pages. Long enough that every page needs scrolling. */

export interface Feature {
  title: string
  body: string
  tag: string
}

export const features: Feature[] = [
  { title: 'Unique selectors', body: 'Every pick carries a CSS selector that resolves to exactly one element.', tag: 'core' },
  { title: 'Component names', body: 'Vue and React internals are read to name the component that owns the element.', tag: 'core' },
  { title: 'Source files', body: 'Where the framework exposes it, the pick points at a file and a line.', tag: 'core' },
  { title: 'Computed style', body: 'Font, colour, spacing and radius as the browser actually renders them.', tag: 'detail' },
  { title: 'Attributes', body: 'Every attribute as written in the markup, values truncated.', tag: 'detail' },
  { title: 'Markup', body: 'Optional outerHTML, whole or elided in the middle to a budget.', tag: 'detail' },
  { title: 'Clipboard', body: 'Mirror each selection to the clipboard, alone or with the whole list.', tag: 'flow' },
  { title: 'Persistence', body: 'Picks are written to .quello/picks.json by the dev server.', tag: 'flow' },
  { title: 'Reload safe', body: 'Badges are re-attached after a reload by re-resolving each selector.', tag: 'flow' },
]

export const sections: Array<{ id: string; title: string; paragraphs: string[] }> = [
  {
    id: 'scrolling',
    title: 'Scrolling',
    paragraphs: [
      'Badges are anchored to their elements on every animation frame, so they track the page as it scrolls rather than drifting away from what they label.',
      'An element scrolled out of view keeps its badge; the badge simply moves with it. Elements with zero size are hidden instead of being drawn at the origin.',
      'This page is deliberately long. Scroll to the bottom with a pick made near the top, then scroll back, and the badge should still sit on the same element.',
    ],
  },
  {
    id: 'sticky',
    title: 'Sticky elements',
    paragraphs: [
      'The navigation bar above is sticky, and so is the rail on the overview page. Sticky elements move relative to the document while staying put on screen.',
      'Picking a sticky element is the sharper test: its bounding rect changes as you scroll even though it looks stationary, so a badge that is positioned once would fall behind.',
    ],
  },
  {
    id: 'routing',
    title: 'Routing',
    paragraphs: [
      'These playgrounds use a real client-side router. Moving between pages does not reload the document, so the quello runtime keeps running and its picks stay in memory.',
      'That is the interesting case: the elements a pick points at are unmounted when you leave a page, while the pick itself survives. Watch what the badges do.',
      'A full reload is the other case, and a different one: the runtime starts fresh and re-resolves stored selectors against the page it lands on.',
    ],
  },
  {
    id: 'repetition',
    title: 'Repeated elements',
    paragraphs: [
      'The gallery page renders many near-identical tiles. They share a tag and a class, so selector generation has to fall back on position to tell them apart.',
      'Pick the third tile in the second row and check that the selector it produces resolves to that tile and no other.',
    ],
  },
]

export interface Tile {
  id: number
  name: string
  group: string
  hue: number
}

const GROUPS = ['layout', 'typography', 'colour', 'motion'] as const

export const tiles: Tile[] = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  name: `Token ${String(i + 1).padStart(2, '0')}`,
  group: GROUPS[i % GROUPS.length]!,
  hue: (i * 37) % 360,
}))

export const groups = ['all', ...GROUPS] as const

export const changelog: Array<{ version: string; date: string; note: string }> = [
  { version: '0.1.0', date: '2026-08-28', note: 'First cut: picker, overlay, Vite plugin.' },
  { version: '0.1.1', date: '2026-08-28', note: 'Computed style on every pick.' },
  { version: '0.1.2', date: '2026-08-28', note: 'Page url and title moved into page.' },
  { version: '0.1.3', date: '2026-08-28', note: 'Attribute list on every pick.' },
  { version: '0.1.4', date: '2026-08-28', note: 'Settings panel and HTML capture modes.' },
  { version: '0.1.5', date: '2026-08-28', note: 'Draggable, collapsible toolbar.' },
  { version: '0.1.6', date: '2026-08-28', note: 'Copy to clipboard on pick.' },
]
