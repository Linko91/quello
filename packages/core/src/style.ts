import type { QuelloStyle } from './types'

/**
 * The computed values that matter when a request is phrased visually —
 * "make this bigger", "tighten the spacing", "why is this grey?".
 * Read from `getComputedStyle`, so they reflect what is actually on screen
 * rather than what a stylesheet asked for.
 */
export function collectStyle(el: Element): QuelloStyle {
  const computed = getComputedStyle(el)
  const read = (property: string): string => computed.getPropertyValue(property).trim()

  const fontSize = read('font-size')
  const lineHeight = read('line-height')

  return {
    display: read('display'),
    font: fontSize && lineHeight ? `${fontSize}/${lineHeight}` : fontSize || lineHeight,
    fontWeight: read('font-weight'),
    color: read('color'),
    background: read('background-color'),
    padding: read('padding'),
    margin: read('margin'),
    gap: read('gap'),
    borderRadius: read('border-radius'),
  }
}
