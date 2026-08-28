import { describe, expect, it } from 'vitest'
import { describeCopy, formatPicks } from '../src/clipboard'
import type { QuelloPick } from '../src/types'

function pick(id: number, selector: string): QuelloPick {
  return {
    id,
    label: `PICK ${id}`,
    selector,
    domPath: `body > ${selector}`,
    tag: selector.split('.')[0] ?? 'div',
    classes: [],
    attributes: {},
    text: '',
    rect: { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
    style: {
      display: 'block',
      font: '',
      fontWeight: '',
      color: '',
      background: '',
      padding: '',
      margin: '',
      gap: '',
      borderRadius: '',
    },
    framework: null,
    page: { url: 'http://localhost/', title: 'test' },
    pickedAt: '2026-01-01T00:00:00.000Z',
  }
}

const picks = [pick(1, 'h1'), pick(2, 'button.cta'), pick(3, 'p')]

describe('formatPicks', () => {
  it('copies only the most recent pick as a single object', () => {
    const parsed = JSON.parse(formatPicks(picks, 'last'))
    expect(Array.isArray(parsed)).toBe(false)
    expect(parsed.id).toBe(3)
    expect(parsed.selector).toBe('p')
  })

  it('copies the whole list as an array, in order', () => {
    const parsed = JSON.parse(formatPicks(picks, 'all'))
    expect(parsed.map((p: QuelloPick) => p.id)).toEqual([1, 2, 3])
  })

  it('pretty-prints so a paste stays readable', () => {
    expect(formatPicks(picks, 'last')).toContain('\n  "id": 3')
  })

  it('returns an empty string when there is nothing to copy', () => {
    expect(formatPicks([], 'last')).toBe('')
    expect(formatPicks([], 'all')).toBe('')
  })
})

describe('describeCopy', () => {
  it('names the pick that was copied', () => {
    expect(describeCopy(picks, 'last')).toBe('Copied PICK 3')
  })

  it('counts the list, with singular and plural', () => {
    expect(describeCopy(picks, 'all')).toBe('Copied 3 picks')
    expect(describeCopy([pick(1, 'h1')], 'all')).toBe('Copied 1 pick')
  })

  it('says so when there is nothing to copy', () => {
    expect(describeCopy([], 'last')).toBe('Nothing to copy')
  })
})
