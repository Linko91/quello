import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuelloPicker } from '../src/picker'
import { DEFAULT_VISIBILITY_SHORTCUT } from '../src/shortcut'

let picker: QuelloPicker | null = null

/** Persistence is not what these are about, so keep the endpoint out of it. */
const make = (options = {}) => {
  picker = new QuelloPicker({ endpoint: null, ...options })
  return picker
}

const host = () => document.querySelector('[data-quello="root"]') as HTMLElement | null

const press = (init: KeyboardEventInit) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  picker?.destroy()
  picker = null
  vi.restoreAllMocks()
})

describe('visibility', () => {
  it('is on the page by default', () => {
    const quello = make()
    expect(quello.visible).toBe(true)
    expect(host()?.style.display).toBe('')
  })

  it('starts hidden when asked, without unmounting', () => {
    const quello = make({ visible: false })
    expect(quello.visible).toBe(false)
    // Hidden, not gone: the host stays so the picks and their badges survive.
    expect(host()).not.toBeNull()
    expect(host()?.style.display).toBe('none')
  })

  it('hides and shows again', () => {
    const quello = make()
    quello.hide()
    expect(quello.visible).toBe(false)
    expect(host()?.style.display).toBe('none')
    quello.show()
    expect(quello.visible).toBe(true)
    expect(host()?.style.display).toBe('')
  })

  it('leaves picker mode when hidden, and does not resume it on show', () => {
    const quello = make({ autoEnable: true })
    expect(quello.enabled).toBe(true)
    quello.hide()
    expect(quello.enabled).toBe(false)
    quello.show()
    expect(quello.enabled).toBe(false)
  })

  it('toggles on its own shortcut', () => {
    const quello = make()
    press({ key: 'q', code: 'KeyQ', altKey: true, shiftKey: true })
    expect(quello.visible).toBe(false)
    press({ key: 'q', code: 'KeyQ', altKey: true, shiftKey: true })
    expect(quello.visible).toBe(true)
  })

  it('takes a shortcut of its own', () => {
    const quello = make({ visibilityShortcut: 'ctrl+shift+h' })
    press({ key: 'h', code: 'KeyH', ctrlKey: true, shiftKey: true })
    expect(quello.visible).toBe(false)
    // The default no longer applies once one is given.
    press({ key: 'q', code: 'KeyQ', altKey: true, shiftKey: true })
    expect(quello.visible).toBe(false)
  })

  it('does not collide with the picker shortcut', () => {
    const quello = make()
    press({ key: 'q', code: 'KeyQ', altKey: true })
    expect(quello.enabled).toBe(true)
    expect(quello.visible).toBe(true)
  })

  it('comes back when the picker shortcut is pressed while hidden', () => {
    const quello = make({ visible: false })
    press({ key: 'q', code: 'KeyQ', altKey: true })
    expect(quello.visible).toBe(true)
    expect(quello.enabled).toBe(true)
  })
})

describe('the console line', () => {
  it('names both shortcuts, since one of them is the only way back', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    make({ shortcut: 'ctrl+shift+p', visibilityShortcut: 'ctrl+shift+h' })
    const printed = log.mock.calls.map((call) => call.join(' ')).join('\n')
    expect(printed).toContain('Ctrl+Shift+P')
    expect(printed).toContain('Ctrl+Shift+H')
  })

  it('names the defaults when nothing was configured', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    make()
    const printed = log.mock.calls.map((call) => call.join(' ')).join('\n')
    expect(printed).toContain('Alt+Q')
    expect(printed).toContain('Alt+Shift+Q')
  })
})

describe('DEFAULT_VISIBILITY_SHORTCUT', () => {
  it('is a sibling of the picker default rather than an unrelated key', () => {
    expect(DEFAULT_VISIBILITY_SHORTCUT).toBe('alt+shift+q')
  })
})
