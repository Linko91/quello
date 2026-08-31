/**
 * Look of the two outlines quello draws on the page. Configured in code, at plugin
 * setup — not from the toolbar, which is for things you change while working.
 *
 * Values are handed to CSS custom properties untouched, so any valid CSS value
 * works; everything else (the hover fill, the label's background) is derived from
 * them in the stylesheet rather than computed here.
 */
export interface QuelloTheme {
  /** Hover outline colour. The translucent fill and the element label follow it. */
  hoverColor?: string
  /** Hover outline width. A number is taken as px. */
  hoverBorderWidth?: string | number
  /** Fill inside a picked element's outline. Defaults to none. */
  pickedFill?: string
  pickedBorderColor?: string
  pickedBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | (string & {})
  /** A number is taken as px. */
  pickedBorderWidth?: string | number
}

type Resolved = Required<{ [K in keyof QuelloTheme]: string }>

export const DEFAULT_THEME: Resolved = {
  hoverColor: '#e09000',
  hoverBorderWidth: '2px',
  pickedFill: 'transparent',
  pickedBorderColor: 'rgba(224, 144, 0, 0.85)',
  pickedBorderStyle: 'dashed',
  pickedBorderWidth: '1.5px',
}

/** Custom property each option lands in. */
export const THEME_VARS: Record<keyof QuelloTheme, string> = {
  hoverColor: '--quello-hover-color',
  hoverBorderWidth: '--quello-hover-border-width',
  pickedFill: '--quello-picked-fill',
  pickedBorderColor: '--quello-picked-border-color',
  pickedBorderStyle: '--quello-picked-border-style',
  pickedBorderWidth: '--quello-picked-border-width',
}

const LENGTHS = new Set<keyof QuelloTheme>(['hoverBorderWidth', 'pickedBorderWidth'])

/**
 * Custom properties accept any token sequence — unlike normal declarations, the
 * browser does not validate them — so anything that could read as more than a
 * single value is refused here. `var()` substitution cannot create new rules, but
 * a value carrying stray braces has no legitimate use either.
 */
const SUSPICIOUS = /[;{}]|\/\*|<\//

/** Bare numbers are px; anything else is passed through, trimmed. */
function toCssValue(key: keyof QuelloTheme, value: string | number): string | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? `${value}px` : null
  }
  const text = String(value).trim()
  if (!text || text.length > 120 || SUSPICIOUS.test(text)) return null
  if (LENGTHS.has(key) && /^\d+(\.\d+)?$/.test(text)) return `${text}px`
  return text
}

export function normalizeTheme(theme: QuelloTheme = {}): Resolved {
  const resolved = { ...DEFAULT_THEME }
  for (const key of Object.keys(THEME_VARS) as Array<keyof QuelloTheme>) {
    const raw = theme[key]
    if (raw === undefined || raw === null) continue
    const value = toCssValue(key, raw)
    if (value !== null) resolved[key] = value
  }
  return resolved
}

/**
 * Written onto the host element rather than into the stylesheet, so a value that
 * the browser cannot use leaves the stylesheet's own default standing.
 */
export function applyTheme(host: HTMLElement, theme: QuelloTheme = {}): Resolved {
  const resolved = normalizeTheme(theme)
  for (const [key, property] of Object.entries(THEME_VARS)) {
    host.style.setProperty(property, resolved[key as keyof QuelloTheme])
  }
  return resolved
}
