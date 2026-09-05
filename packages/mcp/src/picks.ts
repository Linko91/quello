/**
 * Queries over a loaded picks file. Pure functions on an array, so the tool
 * layer stays about protocol and this stays about picks.
 */
import type { QuelloPick } from '@quello/core'

export interface PickQuery {
  /**
   * Substring of the page url or title, case-insensitive — `"/settings"` and
   * `"Settings"` both work. The agent rarely knows the full url.
   */
  page?: string
  /** Keep only picks carrying a note: the ones that are instructions, not bookmarks. */
  withNotes?: boolean
}

/** A note that is present but blank is not a note. */
export function hasNote(pick: QuelloPick): boolean {
  return typeof pick.note === 'string' && pick.note.trim() !== ''
}

export function matchesPage(pick: QuelloPick, needle: string): boolean {
  const wanted = needle.trim().toLowerCase()
  if (wanted === '') return true
  const url = pick.page?.url?.toLowerCase() ?? ''
  const title = pick.page?.title?.toLowerCase() ?? ''
  return url.includes(wanted) || title.includes(wanted)
}

export function filterPicks(picks: readonly QuelloPick[], query: PickQuery = {}): QuelloPick[] {
  return picks.filter((pick) => {
    if (query.withNotes && !hasNote(pick)) return false
    if (query.page !== undefined && !matchesPage(pick, query.page)) return false
    return true
  })
}

export function findPick(picks: readonly QuelloPick[], id: number): QuelloPick | undefined {
  return picks.find((pick) => pick.id === id)
}

/** The picks that are instructions, in the order the agent should work through them. */
export function notedPicks(picks: readonly QuelloPick[]): QuelloPick[] {
  return picks.filter(hasNote).sort((a, b) => a.id - b.id)
}
