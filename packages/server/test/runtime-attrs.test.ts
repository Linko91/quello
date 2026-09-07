import { describe, expect, it } from 'vitest'
import { PICKS_ROUTE, runtimeAttrs } from '../src/runtime'

describe('runtimeAttrs', () => {
  it('falls back to the default endpoint and emits nothing else', () => {
    expect(runtimeAttrs({})).toEqual({ 'data-quello-endpoint': PICKS_ROUTE })
  })

  it('carries the visibility shortcut', () => {
    const attrs = runtimeAttrs({ visibilityShortcut: 'ctrl+shift+h' })
    expect(attrs['data-quello-visibility-shortcut']).toBe('ctrl+shift+h')
  })

  it('says nothing when quello starts visible, which is the default', () => {
    expect(runtimeAttrs({ visible: true })).not.toHaveProperty('data-quello-visible')
    expect(runtimeAttrs({})).not.toHaveProperty('data-quello-visible')
  })

  it('emits `visible` only to turn it off', () => {
    // `false` has to survive the trip: the generic setter drops empty values, and
    // a dropped attribute here would silently mean "visible".
    expect(runtimeAttrs({ visible: false })['data-quello-visible']).toBe('false')
  })
})
