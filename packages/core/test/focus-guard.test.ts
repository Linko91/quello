import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Overlay } from '../src/overlay'
import { QuelloPicker } from '../src/picker'

let picker: QuelloPicker | null = null
let dialog: HTMLElement | null = null
const cleanups: Array<() => void> = []

const shadow = () => (document.querySelector('[data-quello="root"]') as HTMLElement).shadowRoot!
const noteInput = () => shadow().querySelector('.note-editor textarea') as HTMLTextAreaElement
const overlay = () => (picker as unknown as { overlay: Overlay }).overlay

function openDialog(): HTMLButtonElement {
  dialog = document.createElement('div')
  const inside = document.createElement('button')
  inside.textContent = 'inside the dialog'
  dialog.append(inside)
  document.body.append(dialog)
  inside.focus()
  return inside
}

/** vueuc's FocusTrap (Naive UI's NModal/NDrawer): `focus` in capture on document. */
function vueucTrap(first: HTMLElement): void {
  const onFocus = (event: FocusEvent) => {
    if (!dialog!.contains(event.composedPath()[0] as Node)) first.focus()
  }
  document.addEventListener('focus', onFocus, true)
  cleanups.push(() => document.removeEventListener('focus', onFocus, true))
}

/** Radix FocusScope / focus-trap: `focusin` and `focusout` on document. */
function radixTrap(first: HTMLElement): void {
  const onFocusIn = (event: FocusEvent) => {
    if (!dialog!.contains(event.target as Node)) first.focus()
  }
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null
    if (next !== null && !dialog!.contains(next)) first.focus()
  }
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
  cleanups.push(() => {
    document.removeEventListener('focusin', onFocusIn)
    document.removeEventListener('focusout', onFocusOut)
  })
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  picker = new QuelloPicker({ endpoint: null })
})

afterEach(() => {
  for (const off of cleanups.splice(0)) off()
  picker?.destroy()
  picker = null
  dialog?.remove()
  dialog = null
  vi.restoreAllMocks()
})

describe('focus guard', () => {
  it("keeps the note editor focusable inside a vueuc focus trap (Naive UI's NModal/NDrawer)", () => {
    vueucTrap(openDialog())
    noteInput().focus()
    expect(shadow().activeElement).toBe(noteInput())
  })

  it('keeps the note editor focusable inside a focusin/focusout trap (Radix, focus-trap)', () => {
    radixTrap(openDialog())
    noteInput().focus()
    expect(shadow().activeElement).toBe(noteInput())
  })

  it("still lets the page's trap hold focus between its own elements", () => {
    const inside = openDialog()
    const outside = document.createElement('button')
    document.body.append(outside)
    cleanups.push(() => outside.remove())
    vueucTrap(inside)
    outside.focus()
    expect(document.activeElement).toBe(inside)
  })

  it('closes the note on Escape without the page seeing the key (a modal stays open)', () => {
    const inside = openDialog()
    const pageKeys: string[] = []
    const record = (event: KeyboardEvent) => pageKeys.push(event.key)
    document.addEventListener('keydown', record)
    cleanups.push(() => document.removeEventListener('keydown', record))

    overlay().openNote(1, '')
    noteInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))

    expect(overlay().noteOpen).toBe(false)
    expect(pageKeys).toEqual([])
    expect(document.activeElement).toBe(inside)
  })

  it('hands focus back to the field the page had before the note', () => {
    const inside = openDialog()
    vueucTrap(inside)
    overlay().openNote(1, '')
    expect(shadow().activeElement).toBe(noteInput())

    noteInput().value = 'make this red'
    noteInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }))

    expect(overlay().noteOpen).toBe(false)
    expect(document.activeElement).toBe(inside)
  })

  it('hands focus back even when pressing quello blurred the field first (a badge click)', () => {
    const inside = openDialog()
    vueucTrap(inside)
    shadow()
      .querySelector('.toolbar')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
    inside.blur() // what the browser does on mousedown over something that can't take focus
    expect(document.activeElement).toBe(document.body)

    overlay().openNote(1, '')
    noteInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }))

    expect(document.activeElement).toBe(inside)
  })

  it('lets the page see focus events again once quello is destroyed', () => {
    const seen: EventTarget[] = []
    const record = (event: FocusEvent) => seen.push(event.composedPath()[0])
    document.addEventListener('focus', record, true)
    cleanups.push(() => document.removeEventListener('focus', record, true))
    const input = noteInput()
    input.focus()
    expect(seen).not.toContain(input)

    picker!.destroy()
    picker = null
    const field = document.createElement('input')
    document.body.append(field)
    cleanups.push(() => field.remove())
    field.focus()
    expect(seen).toContain(field)
  })
})
