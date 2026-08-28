import { beforeEach, describe, expect, it } from 'vitest'
import { collectStyle } from '../src/style'

function mount(html: string): Element {
  document.body.innerHTML = html
  const el = document.body.firstElementChild
  if (!el) throw new Error('fixture is empty')
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('collectStyle', () => {
  it('reports every key, so the pick shape is stable', () => {
    const style = collectStyle(mount('<div>x</div>'))
    expect(Object.keys(style).sort()).toEqual([
      'background',
      'borderRadius',
      'color',
      'display',
      'font',
      'fontWeight',
      'gap',
      'margin',
      'padding',
    ])
  })

  it('reads the values that are actually applied', () => {
    const style = collectStyle(
      mount('<div style="color: rgb(1, 2, 3); padding: 8px; font-weight: 700">x</div>'),
    )
    expect(style.color).toBe('rgb(1, 2, 3)')
    expect(style.padding).toBe('8px')
    expect(style.fontWeight).toBe('700')
  })

  it('combines font-size and line-height', () => {
    const style = collectStyle(mount('<p style="font-size: 14px; line-height: 20px">x</p>'))
    expect(style.font).toBe('14px/20px')
  })

  it('does not emit a bare separator when one font value is missing', () => {
    const style = collectStyle(mount('<p style="font-size: 14px">x</p>'))
    expect(style.font).not.toMatch(/^\/|\/$/)
    expect(style.font).toContain('14px')
  })
})
