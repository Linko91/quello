import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuelloPicker } from '../src/picker'

let picker: QuelloPicker | null = null

const shadow = () => (document.querySelector('[data-quello="root"]') as HTMLElement).shadowRoot!
const control = (label: string) => shadow().querySelector(`[title="${label}"]`) as HTMLElement
const picksList = () => shadow().querySelector('.picks-list') as HTMLElement

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  picker = new QuelloPicker({ endpoint: null })
})

afterEach(() => {
  picker?.destroy()
  picker = null
  vi.restoreAllMocks()
})

describe('compact toolbar', () => {
  it('closes the picks list when the toolbar collapses', () => {
    control('Show every pick').click()
    expect(picksList().hidden).toBe(false)

    control('Collapse the toolbar').click()
    expect(picksList().hidden).toBe(true)
  })
})
