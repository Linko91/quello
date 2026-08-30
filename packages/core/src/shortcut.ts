/**
 * Keyboard shortcuts are declared in full — `alt+q`, `ctrl+shift+p`, `f2` — so a
 * combination without Alt is just as expressible as one with it.
 */
export interface Shortcut {
  /** Lowercase key name, e.g. `q`, `f2`, `escape`. */
  key: string
  alt: boolean
  ctrl: boolean
  shift: boolean
  meta: boolean
}

export const DEFAULT_SHORTCUT = 'alt+q'

const MODIFIERS: Record<string, keyof Omit<Shortcut, 'key'>> = {
  alt: 'alt',
  opt: 'alt',
  option: 'alt',
  ctrl: 'ctrl',
  control: 'ctrl',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  win: 'meta',
}

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  space: ' ',
  spacebar: ' ',
  plus: '+',
  del: 'delete',
  ins: 'insert',
  return: 'enter',
}

/**
 * `event.key` is unreliable for letters once Alt is held — on macOS Alt+Q reports
 * `œ` — so a physical `code` is derived where one exists and either may match.
 */
function codeFor(key: string): string | null {
  if (/^[a-z]$/.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  if (/^f([1-9]|1[0-2])$/.test(key)) return key.toUpperCase()
  return null
}

export function parseShortcut(input: string, fallback = DEFAULT_SHORTCUT): Shortcut {
  const parsed = tryParse(input)
  return parsed ?? tryParse(fallback) ?? { key: 'q', alt: true, ctrl: false, shift: false, meta: false }
}

function tryParse(input: string): Shortcut | null {
  const parts = String(input ?? '')
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)

  // `alt++` means the plus key: an empty final part is that, not a mistake.
  if (/\+\s*\+\s*$/.test(String(input ?? '').toLowerCase())) parts.push('+')
  if (parts.length === 0) return null

  const shortcut: Shortcut = { key: '', alt: false, ctrl: false, shift: false, meta: false }
  for (const part of parts) {
    const modifier = MODIFIERS[part]
    if (modifier) {
      shortcut[modifier] = true
      continue
    }
    shortcut.key = KEY_ALIASES[part] ?? part
  }
  return shortcut.key ? shortcut : null
}

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  if (
    event.altKey !== shortcut.alt ||
    event.ctrlKey !== shortcut.ctrl ||
    event.shiftKey !== shortcut.shift ||
    event.metaKey !== shortcut.meta
  ) {
    return false
  }
  const code = codeFor(shortcut.key)
  return (code !== null && event.code === code) || event.key.toLowerCase() === shortcut.key
}

/** `true` when the combination is bare enough to fire while someone is typing. */
export function needsTypingGuard(shortcut: Shortcut): boolean {
  return !shortcut.alt && !shortcut.ctrl && !shortcut.meta
}

/** Human-readable form for tooltips, e.g. `Alt+Q`. */
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = []
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.meta) parts.push('Cmd')
  parts.push(shortcut.key === ' ' ? 'Space' : label(shortcut.key))
  return parts.join('+')
}

function label(key: string): string {
  if (key.length === 1) return key.toUpperCase()
  if (/^f([1-9]|1[0-2])$/.test(key)) return key.toUpperCase()
  return key.charAt(0).toUpperCase() + key.slice(1)
}
