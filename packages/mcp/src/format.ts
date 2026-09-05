/**
 * Turning picks into the text an agent reads.
 *
 * Labelled lines rather than pretty-printed JSON: it is a third of the tokens
 * for the same fields, and the fields an agent acts on — the source location, the
 * note — end up at the top instead of wherever the key order left them. The
 * lossless JSON is still one `resources/read` away.
 *
 * Every field is treated as possibly missing. The store only insists on `id` and
 * `selector`, so a hand-edited or half-written picks file is a normal input here,
 * not a crash.
 */
import type { QuelloPick } from '@quello/core'
import { hasNote, notedPicks } from './picks'

/** Collapse whitespace and cut, so a line stays one line. */
export function oneLine(value: string, limit = 240): string {
  const flat = value.replace(/\s+/g, ' ').trim()
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat
}

/** `PICK 2` — what the user says out loud. */
export function pickName(pick: QuelloPick): string {
  return `PICK ${pick.id}`
}

/**
 * Where the pick's source is, as precisely as its framework allowed. Falls back
 * to the selector, which is the one field a pick always has.
 */
export function locationOf(pick: QuelloPick): string {
  const info = pick.framework
  if (!info) return pick.selector
  const at =
    info.file && info.line != null
      ? `${info.file}:${info.line}${info.column != null ? `:${info.column}` : ''}`
      : info.file
  if (at && info.component) return `${at} (${info.component})`
  if (at) return at
  if (info.component) return info.component
  return pick.selector
}

/** `<button class="cta">`, near enough to recognise the element by. */
function tagOf(pick: QuelloPick): string {
  const tag = pick.tag ?? ''
  const classes = pick.classes?.filter(Boolean) ?? []
  if (!tag) return pick.selector
  return classes.length ? `<${tag} class="${classes.join(' ')}">` : `<${tag}>`
}

/** One line per pick, for a list the agent scans before asking for detail. */
export function summarizePick(pick: QuelloPick): string {
  const tag = tagOf(pick)
  const location = locationOf(pick)
  // Both fall back to the selector on a pick with no tag and no framework, and
  // printing it twice reads like a bug.
  const parts = location === tag ? [pickName(pick), tag] : [pickName(pick), tag, location]
  const text = pick.text ? `"${oneLine(pick.text, 60)}"` : ''
  if (text) parts.push(text)
  if (hasNote(pick)) parts.push(`note: ${oneLine(pick.note ?? '', 120)}`)
  return parts.filter(Boolean).join(' · ')
}

const LABEL_WIDTH = 12

function line(label: string, value: string | undefined | null): string | null {
  if (value === undefined || value === null || value === '') return null
  return `  ${label.padEnd(LABEL_WIDTH)}${value}`
}

function styleOf(pick: QuelloPick): string {
  const style = pick.style
  if (!style || typeof style !== 'object') return ''
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    // `fontWeight` is camelCase in the type because it came from `getComputedStyle`;
    // as CSS to be matched against a stylesheet it wants to be `font-weight`.
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${String(value)}`)
    .join('; ')
}

function boxOf(pick: QuelloPick): string {
  const rect = pick.rect
  if (!rect || typeof rect.width !== 'number' || typeof rect.height !== 'number') return ''
  const at = typeof rect.x === 'number' && typeof rect.y === 'number' ? ` at ${rect.x},${rect.y}` : ''
  return `${rect.width}×${rect.height}${at}`
}

function attributesOf(pick: QuelloPick): string {
  const attributes = pick.attributes
  if (!attributes || typeof attributes !== 'object') return ''
  return Object.entries(attributes)
    .map(([name, value]) => (value === '' ? name : `${name}="${value}"`))
    .join(' ')
}

function pageOf(pick: QuelloPick): string {
  const page = pick.page
  if (!page) return ''
  if (page.title && page.url) return `${page.title} — ${page.url}`
  return page.url || page.title || ''
}

/** Every field of a pick, most useful first. */
export function describePick(pick: QuelloPick): string {
  const heading = pick.label ? `${pickName(pick)} — ${pick.label}` : pickName(pick)
  const framework = pick.framework?.framework
  const rows = [
    line('note', pick.note ? oneLine(pick.note, 1000) : ''),
    line('source', locationOf(pick)),
    line('framework', framework ?? ''),
    line('selector', pick.selector),
    line('dom path', pick.domPath ?? ''),
    line('tag', pick.tag ?? ''),
    line('classes', pick.classes?.filter(Boolean).join(' ') ?? ''),
    line('text', pick.text ? oneLine(pick.text, 400) : ''),
    line('attributes', attributesOf(pick)),
    line('page', pageOf(pick)),
    line('box', boxOf(pick)),
    line('style', styleOf(pick)),
    line('html', pick.html ? oneLine(pick.html, 2000) : ''),
    line('picked at', pick.pickedAt ?? ''),
  ].filter((row): row is string => row !== null)
  return [heading, ...rows].join('\n')
}

/** How stale the picks are, and where they came from. */
export function describeSource(path: string, updatedAt: string | undefined): string {
  return updatedAt ? `${path} · updated ${updatedAt}` : path
}

export interface ListOptions {
  detail?: 'summary' | 'full'
  /** Shown at the top so the agent knows which file answered. */
  source?: string
  /** What was filtered out, phrased for the "no picks" line. */
  scope?: string
}

/** The `list_picks` body: a header, then one line or one block per pick. */
export function formatPickList(
  picks: readonly QuelloPick[],
  { detail = 'summary', source, scope }: ListOptions = {},
): string {
  const header = source ? [source] : []
  if (picks.length === 0) {
    return [
      ...header,
      scope
        ? `No picks ${scope}.`
        : 'No picks yet. The user makes them in the browser: Alt+Q, then click an element.',
    ].join('\n\n')
  }

  const count = `${picks.length} pick${picks.length === 1 ? '' : 's'}`
  const body =
    detail === 'full'
      ? picks.map(describePick).join('\n\n')
      : picks.map((pick) => summarizePick(pick)).join('\n')
  return [...header, `${count}${scope ? ` ${scope}` : ''}:`, body].join('\n\n')
}

/**
 * The `resolve_picks` body: the notes as a numbered plan, in `id` order, each one
 * with the source to open. This is the MCP form of the "resolve the picks"
 * instruction the plugins write into `AGENTS.md`.
 */
export function formatResolvePlan(picks: readonly QuelloPick[], source?: string): string {
  const noted = notedPicks(picks)
  const header = source ? [source] : []

  if (noted.length === 0) {
    const bookmarks = picks.length
    return [
      ...header,
      bookmarks === 0
        ? 'No picks yet, so there is nothing to resolve.'
        : `None of the ${bookmarks} pick${bookmarks === 1 ? '' : 's'} carries a note, so there is nothing to resolve. Picks without a note are bookmarks — ask the user what to do with them.`,
    ].join('\n\n')
  }

  const steps = noted.map((pick, index) => {
    const rows = [
      `${index + 1}. ${pickName(pick)} — ${locationOf(pick)}`,
      `   note: ${oneLine(pick.note ?? '', 1000)}`,
      `   element: ${tagOf(pick)}`,
    ]
    const page = pageOf(pick)
    if (page) rows.push(`   page: ${page}`)
    return rows.join('\n')
  })

  const skipped = picks.length - noted.length
  const footer = [
    'Carry out each note as an instruction scoped to that element, in this order, and report what you changed per pick.',
    skipped > 0
      ? `${skipped} other pick${skipped === 1 ? ' is a bookmark' : 's are bookmarks'} with no note — leave ${skipped === 1 ? 'it' : 'them'} alone unless the user says otherwise.`
      : '',
    'Do not edit the picks file: the user clears it from the toolbar.',
  ].filter(Boolean)

  return [
    ...header,
    `${noted.length} pick${noted.length === 1 ? '' : 's'} to resolve, in order:`,
    steps.join('\n\n'),
    footer.join(' '),
  ].join('\n\n')
}
