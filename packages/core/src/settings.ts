import type { QuelloCopyScope, QuelloHtmlMode, QuelloPoint, QuelloSettings } from './types'

const STORAGE_KEY = 'quello.settings'

/** Sits where the elision happened, so a truncated snippet reads as obviously partial. */
const ELISION = ' … '

const HTML_MODES: readonly QuelloHtmlMode[] = ['none', 'truncated', 'full']
const COPY_SCOPES: readonly QuelloCopyScope[] = ['last', 'all']

export const MIN_HTML_LIMIT = 50
export const MAX_HTML_LIMIT = 100_000

export const DEFAULT_SETTINGS: QuelloSettings = {
  htmlMode: 'truncated',
  htmlLimit: 1000,
  toolbarPosition: null,
  toolbarCompact: false,
  // Off by default: the clipboard belongs to the user, not to the tool.
  copyOnPick: false,
  copyScope: 'last',
  noteOnPick: false,
}

/**
 * Keep the head and the tail, drop the middle.
 *
 * Markup carries its identity at both ends — the opening tag with its attributes,
 * the closing tags that show where the element sits — while the bulk in between is
 * usually the least identifying part. The result is never longer than `limit`.
 */
export function truncateMiddle(input: string, limit: number): string {
  if (limit <= 0) return ''
  if (input.length <= limit) return input
  if (limit <= ELISION.length) return input.slice(0, limit)

  const keep = limit - ELISION.length
  const head = Math.ceil(keep / 2)
  const tail = keep - head
  return input.slice(0, head) + ELISION + input.slice(input.length - tail)
}

/** `undefined` when the user asked for no HTML, so the field is absent from the pick. */
export function collectHtml(el: Element, settings: QuelloSettings): string | undefined {
  if (settings.htmlMode === 'none') return undefined
  const html = el.outerHTML
  if (settings.htmlMode === 'full') return html
  return truncateMiddle(html, settings.htmlLimit)
}

function clampLimit(value: unknown, fallback: number): number {
  const limit = Math.round(Number(value))
  if (!Number.isFinite(limit)) return fallback
  return Math.min(MAX_HTML_LIMIT, Math.max(MIN_HTML_LIMIT, limit))
}

function normalizePoint(input: unknown): QuelloPoint | null {
  if (!input || typeof input !== 'object') return null
  const { x, y } = input as Partial<QuelloPoint>
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x: Math.round(x as number), y: Math.round(y as number) }
}

export function normalizeSettings(
  input: unknown,
  fallback: QuelloSettings = DEFAULT_SETTINGS,
): QuelloSettings {
  const raw = (input ?? {}) as Partial<QuelloSettings>
  const mode = HTML_MODES.includes(raw.htmlMode as QuelloHtmlMode)
    ? (raw.htmlMode as QuelloHtmlMode)
    : fallback.htmlMode
  return {
    htmlMode: mode,
    htmlLimit: clampLimit(raw.htmlLimit ?? fallback.htmlLimit, fallback.htmlLimit),
    toolbarPosition: normalizePoint(raw.toolbarPosition ?? fallback.toolbarPosition),
    toolbarCompact: Boolean(raw.toolbarCompact ?? fallback.toolbarCompact),
    copyOnPick: Boolean(raw.copyOnPick ?? fallback.copyOnPick),
    copyScope: COPY_SCOPES.includes(raw.copyScope as QuelloCopyScope)
      ? (raw.copyScope as QuelloCopyScope)
      : fallback.copyScope,
    noteOnPick: Boolean(raw.noteOnPick ?? fallback.noteOnPick),
  }
}

/** Settings are per-developer, not per-project, so they live in localStorage. */
export function loadSettings(fallback: QuelloSettings = DEFAULT_SETTINGS): QuelloSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return normalizeSettings({}, fallback)
    return normalizeSettings(JSON.parse(raw), fallback)
  } catch {
    return normalizeSettings({}, fallback)
  }
}

export function saveSettings(settings: QuelloSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private browsing or blocked storage: the picker still works, it just forgets.
  }
}
