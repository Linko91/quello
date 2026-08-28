import { beforeEach, describe, expect, it } from 'vitest'
import {
  collectHtml,
  DEFAULT_SETTINGS,
  MIN_HTML_LIMIT,
  normalizeSettings,
  truncateMiddle,
} from '../src/settings'
import type { QuelloSettings } from '../src/types'

function mount(html: string): Element {
  document.body.innerHTML = html
  const el = document.body.firstElementChild
  if (!el) throw new Error('fixture is empty')
  return el
}

const settings = (patch: Partial<QuelloSettings>): QuelloSettings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('truncateMiddle', () => {
  it('leaves input shorter than the limit untouched', () => {
    expect(truncateMiddle('abcdef', 10)).toBe('abcdef')
    expect(truncateMiddle('abcdef', 6)).toBe('abcdef')
  })

  it('never returns more than the limit', () => {
    for (const limit of [4, 10, 25, 99]) {
      expect(truncateMiddle('x'.repeat(500), limit).length).toBeLessThanOrEqual(limit)
    }
  })

  it('keeps the head and the tail, dropping the middle', () => {
    // 13 = 5 head + 3 elision + 5 tail
    const result = truncateMiddle('START' + 'x'.repeat(200) + 'END', 13)
    expect(result).toBe('START … xxEND')
    expect(result).toHaveLength(13)
    expect(result.startsWith('START')).toBe(true)
    expect(result.endsWith('END')).toBe(true)
  })

  it('keeps both ends of real markup', () => {
    const html = `<div class="card">${'<span>filler</span>'.repeat(40)}</div>`
    const result = truncateMiddle(html, 60)
    expect(result).toContain('<div class="card">')
    expect(result).toContain('</div>')
    expect(result).toContain('…')
    expect(result.length).toBe(60)
  })

  it('degrades to a plain cut when the limit cannot fit the elision marker', () => {
    expect(truncateMiddle('abcdef', 2)).toBe('ab')
    expect(truncateMiddle('abcdef', 0)).toBe('')
  })
})

describe('collectHtml', () => {
  it('returns undefined when the mode is none', () => {
    expect(collectHtml(mount('<div>x</div>'), settings({ htmlMode: 'none' }))).toBeUndefined()
  })

  it('returns the complete outerHTML when the mode is full', () => {
    const el = mount('<div class="a"><span>x</span></div>')
    expect(collectHtml(el, settings({ htmlMode: 'full' }))).toBe(el.outerHTML)
  })

  it('truncates to the configured limit', () => {
    const el = mount(`<div>${'y'.repeat(500)}</div>`)
    const html = collectHtml(el, settings({ htmlMode: 'truncated', htmlLimit: 80 }))
    expect(html).toHaveLength(80)
    expect(html).toContain('<div>')
    expect(html).toContain('</div>')
  })

  it('does not truncate markup already under the limit', () => {
    const el = mount('<b>hi</b>')
    expect(collectHtml(el, settings({ htmlMode: 'truncated', htmlLimit: 500 }))).toBe('<b>hi</b>')
  })
})

describe('normalizeSettings', () => {
  it('falls back on an unknown mode', () => {
    expect(normalizeSettings({ htmlMode: 'nope' }).htmlMode).toBe(DEFAULT_SETTINGS.htmlMode)
  })

  it('clamps the limit into a usable range', () => {
    expect(normalizeSettings({ htmlLimit: 1 }).htmlLimit).toBe(MIN_HTML_LIMIT)
    expect(normalizeSettings({ htmlLimit: 10_000_000 }).htmlLimit).toBe(100_000)
    expect(normalizeSettings({ htmlLimit: Number.NaN }).htmlLimit).toBe(DEFAULT_SETTINGS.htmlLimit)
  })

  it('survives junk', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('nonsense')).toEqual(DEFAULT_SETTINGS)
  })
})
