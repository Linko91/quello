import { describe, expect, it } from 'vitest'
import { applyTheme, DEFAULT_THEME, normalizeTheme, THEME_VARS } from '../src/theme'

describe('normalizeTheme', () => {
  it('leaves the defaults alone when nothing is given', () => {
    expect(normalizeTheme()).toEqual(DEFAULT_THEME)
    expect(normalizeTheme({})).toEqual(DEFAULT_THEME)
  })

  it('overrides only what was set', () => {
    const theme = normalizeTheme({ hoverColor: '#0ea5e9' })
    expect(theme.hoverColor).toBe('#0ea5e9')
    expect(theme.pickedBorderStyle).toBe(DEFAULT_THEME.pickedBorderStyle)
  })

  it('reads a bare number as px', () => {
    expect(normalizeTheme({ hoverBorderWidth: 3 }).hoverBorderWidth).toBe('3px')
    expect(normalizeTheme({ pickedBorderWidth: '2' }).pickedBorderWidth).toBe('2px')
  })

  it('passes any other CSS value through', () => {
    expect(normalizeTheme({ hoverBorderWidth: '0.125rem' }).hoverBorderWidth).toBe('0.125rem')
    expect(normalizeTheme({ pickedFill: 'rgba(0, 200, 120, 0.15)' }).pickedFill).toBe(
      'rgba(0, 200, 120, 0.15)',
    )
    expect(normalizeTheme({ hoverColor: '  tomato  ' }).hoverColor).toBe('tomato')
  })

  it('ignores values it cannot use', () => {
    expect(normalizeTheme({ pickedFill: 'red; }' }).pickedFill).toBe(DEFAULT_THEME.pickedFill)
    expect(normalizeTheme({ hoverColor: 'red /* x' }).hoverColor).toBe(DEFAULT_THEME.hoverColor)
    expect(normalizeTheme({ hoverBorderWidth: -2 }).hoverBorderWidth).toBe(DEFAULT_THEME.hoverBorderWidth)
    expect(normalizeTheme({ hoverColor: '' }).hoverColor).toBe(DEFAULT_THEME.hoverColor)
    expect(normalizeTheme({ hoverColor: 'x'.repeat(200) }).hoverColor).toBe(DEFAULT_THEME.hoverColor)
    expect(normalizeTheme({ hoverBorderWidth: Number.NaN }).hoverBorderWidth).toBe(
      DEFAULT_THEME.hoverBorderWidth,
    )
  })
})

describe('applyTheme', () => {
  it('writes every variable onto the host', () => {
    const host = document.createElement('div')
    applyTheme(host, { hoverColor: 'tomato', pickedBorderStyle: 'solid' })
    expect(host.style.getPropertyValue(THEME_VARS.hoverColor)).toBe('tomato')
    expect(host.style.getPropertyValue(THEME_VARS.pickedBorderStyle)).toBe('solid')
    expect(host.style.getPropertyValue(THEME_VARS.pickedBorderColor)).toBe(
      DEFAULT_THEME.pickedBorderColor,
    )
  })

  it('refuses values that carry more than a single CSS value', () => {
    const host = document.createElement('div')
    applyTheme(host, { hoverColor: 'red; } body { display: none' })
    // Custom properties are not validated by the browser, so the check is ours.
    expect(host.getAttribute('style')).not.toContain('display: none')
    expect(host.style.getPropertyValue(THEME_VARS.hoverColor)).toBe(DEFAULT_THEME.hoverColor)
  })
})
