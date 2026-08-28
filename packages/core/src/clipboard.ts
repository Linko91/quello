import type { QuelloCopyScope, QuelloPick } from './types'

/**
 * The clipboard payload uses the same JSON shape as `.quello/picks.json`, so a
 * pasted pick is something an agent already knows how to read: a single object
 * for `last`, the array for `all`.
 */
export function formatPicks(picks: QuelloPick[], scope: QuelloCopyScope): string {
  if (picks.length === 0) return ''
  const payload = scope === 'last' ? picks[picks.length - 1] : picks
  return JSON.stringify(payload, null, 2)
}

/** Human-readable confirmation for the toolbar flash. */
export function describeCopy(picks: QuelloPick[], scope: QuelloCopyScope): string {
  if (scope === 'all') return picks.length === 1 ? 'Copied 1 pick' : `Copied ${picks.length} picks`
  const last = picks[picks.length - 1]
  return last ? `Copied ${last.label}` : 'Nothing to copy'
}

/**
 * Writing to the clipboard fails in ways that are entirely normal — an unfocused
 * document, a denied permission — so the result is reported rather than thrown.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return legacyCopy(text)
  }
}

/** `execCommand` is deprecated but remains the only fallback when the async API is refused. */
function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.cssText = 'position:fixed;top:-9999px;opacity:0'
  document.body.appendChild(area)
  try {
    area.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}
