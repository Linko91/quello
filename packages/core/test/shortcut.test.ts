import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHORTCUT,
  formatShortcut,
  matchesShortcut,
  needsTypingGuard,
  parseShortcut,
} from '../src/shortcut'

const press = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init)

describe('parseShortcut', () => {
  it('takes the modifiers from the string rather than assuming them', () => {
    expect(parseShortcut('alt+q')).toEqual({ key: 'q', alt: true, ctrl: false, shift: false, meta: false })
    expect(parseShortcut('q')).toEqual({ key: 'q', alt: false, ctrl: false, shift: false, meta: false })
  })

  it('accepts several modifiers', () => {
    expect(parseShortcut('ctrl+shift+p')).toMatchObject({ key: 'p', ctrl: true, shift: true, alt: false })
  })

  it('understands the usual aliases', () => {
    expect(parseShortcut('cmd+k').meta).toBe(true)
    expect(parseShortcut('command+k').meta).toBe(true)
    expect(parseShortcut('control+k').ctrl).toBe(true)
    expect(parseShortcut('option+k').alt).toBe(true)
    expect(parseShortcut('ctrl+esc').key).toBe('escape')
  })

  it('ignores case and stray whitespace', () => {
    expect(parseShortcut('  ALT + Q ')).toMatchObject({ key: 'q', alt: true })
  })

  it('supports function keys on their own', () => {
    expect(parseShortcut('f2')).toMatchObject({ key: 'f2', alt: false, ctrl: false })
  })

  it('falls back when the string names no key', () => {
    expect(parseShortcut('alt+')).toEqual(parseShortcut(DEFAULT_SHORTCUT))
    expect(parseShortcut('')).toEqual(parseShortcut(DEFAULT_SHORTCUT))
  })
})

describe('matchesShortcut', () => {
  const altQ = parseShortcut('alt+q')

  it('matches the declared combination', () => {
    expect(matchesShortcut(press({ key: 'q', code: 'KeyQ', altKey: true }), altQ)).toBe(true)
  })

  it('rejects the same key without its modifier', () => {
    expect(matchesShortcut(press({ key: 'q', code: 'KeyQ' }), altQ)).toBe(false)
  })

  it('rejects extra modifiers', () => {
    expect(matchesShortcut(press({ key: 'q', code: 'KeyQ', altKey: true, ctrlKey: true }), altQ)).toBe(false)
  })

  it('matches through the physical code when Alt rewrites the character', () => {
    // macOS reports Alt+Q as "œ"; the code still says KeyQ.
    expect(matchesShortcut(press({ key: 'œ', code: 'KeyQ', altKey: true }), altQ)).toBe(true)
  })

  it('matches a modifier-free key', () => {
    const f2 = parseShortcut('f2')
    expect(matchesShortcut(press({ key: 'F2', code: 'F2' }), f2)).toBe(true)
    expect(matchesShortcut(press({ key: 'F2', code: 'F2', shiftKey: true }), f2)).toBe(false)
  })

  it('matches combinations that use no Alt at all', () => {
    const ctrlShiftP = parseShortcut('ctrl+shift+p')
    expect(matchesShortcut(press({ key: 'P', code: 'KeyP', ctrlKey: true, shiftKey: true }), ctrlShiftP)).toBe(true)
    expect(matchesShortcut(press({ key: 'p', code: 'KeyP', ctrlKey: true }), ctrlShiftP)).toBe(false)
  })
})

describe('needsTypingGuard', () => {
  it('is on only for combinations that could fire mid-sentence', () => {
    expect(needsTypingGuard(parseShortcut('q'))).toBe(true)
    expect(needsTypingGuard(parseShortcut('shift+q'))).toBe(true)
    expect(needsTypingGuard(parseShortcut('alt+q'))).toBe(false)
    expect(needsTypingGuard(parseShortcut('ctrl+q'))).toBe(false)
    expect(needsTypingGuard(parseShortcut('cmd+q'))).toBe(false)
  })
})

describe('formatShortcut', () => {
  it('reads the way a tooltip should', () => {
    expect(formatShortcut(parseShortcut('alt+q'))).toBe('Alt+Q')
    expect(formatShortcut(parseShortcut('ctrl+shift+p'))).toBe('Ctrl+Shift+P')
    expect(formatShortcut(parseShortcut('cmd+k'))).toBe('Cmd+K')
    expect(formatShortcut(parseShortcut('f2'))).toBe('F2')
    expect(formatShortcut(parseShortcut('ctrl+escape'))).toBe('Ctrl+Escape')
  })
})
