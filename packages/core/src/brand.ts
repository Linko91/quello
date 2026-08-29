/**
 * The quello mark: a lowercase "q" whose bowl is the picker's target ring.
 *
 * The descender is what keeps it a letter — without it the bowl and stem read as
 * the lens and handle of a magnifier, which would say "search" rather than "this
 * one". Drawn with `currentColor` so it inherits whatever it sits on.
 */
export function markSvg(height = 21): string {
  const width = (height * 20) / 24
  return `<svg width="${width}" height="${height}" viewBox="0 0 20 24" fill="none" aria-hidden="true" focusable="false">
  <circle cx="8.6" cy="8.6" r="6" stroke="currentColor" stroke-width="2.6"/>
  <circle cx="8.6" cy="8.6" r="1.8" fill="currentColor"/>
  <path d="M14.6 8.6 V22" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
</svg>`
}

/**
 * The wordmark: the same "q", with "uello" built on its grid — one stroke weight
 * (2.6), one x-height (the bowl's diameter), and round joins throughout, so the
 * letters read as a family rather than as a mark glued to a font.
 */
export function logoSvg(height = 24): string {
  const width = (height * 86) / 24
  return `<svg width="${width}" height="${height}" viewBox="0 0 86 24" fill="none" aria-hidden="true" focusable="false">
  <g stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8.6" cy="8.6" r="6"/>
    <path d="M14.6 8.6 V22"/>
    <path d="M21 2.6 V8.6 A6 6 0 0 0 33 8.6 V2.6"/>
    <path d="M33 8.6 V14.6"/>
    <path d="M50.2 12.5 A6 6 0 1 1 51.6 8.6 H39.6"/>
    <path d="M58.2 1.6 V14.6"/>
    <path d="M64 1.6 V14.6"/>
    <circle cx="76.4" cy="8.6" r="6"/>
  </g>
  <circle cx="8.6" cy="8.6" r="1.8" fill="currentColor"/>
</svg>`
}
