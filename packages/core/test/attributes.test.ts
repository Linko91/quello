import { beforeEach, describe, expect, it } from 'vitest'
import { collectAttributes } from '../src/attributes'

function mount(html: string): Element {
  document.body.innerHTML = html
  const el = document.body.firstElementChild
  if (!el) throw new Error('fixture is empty')
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('collectAttributes', () => {
  it('collects every attribute in document order', () => {
    const attrs = collectAttributes(
      mount('<a id="go" href="/next" data-track="cta" aria-label="Next page">n</a>'),
    )
    expect(Object.keys(attrs)).toEqual(['id', 'href', 'data-track', 'aria-label'])
    expect(attrs.href).toBe('/next')
    expect(attrs['aria-label']).toBe('Next page')
  })

  it('returns an empty object for an element without attributes', () => {
    expect(collectAttributes(mount('<span>x</span>'))).toEqual({})
  })

  it('reads a boolean attribute as an empty string', () => {
    const attrs = collectAttributes(mount('<input disabled />'))
    expect(attrs.disabled).toBe('')
  })

  it('keeps class and id even though they are reported elsewhere', () => {
    const attrs = collectAttributes(mount('<div id="app" class="a b">x</div>'))
    expect(attrs.id).toBe('app')
    expect(attrs.class).toBe('a b')
  })

  it('collapses whitespace inside values', () => {
    const attrs = collectAttributes(mount('<div class="a\n   b">x</div>'))
    expect(attrs.class).toBe('a b')
  })

  it('truncates long values so one attribute cannot bloat the file', () => {
    const long = 'x'.repeat(400)
    const attrs = collectAttributes(mount(`<div data-blob="${long}">x</div>`), 20)
    expect(attrs['data-blob']).toHaveLength(21)
    expect(attrs['data-blob']!.endsWith('…')).toBe(true)
  })
})
