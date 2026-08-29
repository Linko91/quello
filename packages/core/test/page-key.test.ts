import { describe, expect, it } from 'vitest'
import { pageKey } from '../src/picker'

describe('pageKey', () => {
  it('treats different paths as different pages', () => {
    expect(pageKey('http://localhost:5175/')).not.toBe(pageKey('http://localhost:5175/gallery'))
  })

  it('ignores the hash, so an in-page anchor is still the same page', () => {
    expect(pageKey('http://localhost:5175/#scrolling')).toBe(pageKey('http://localhost:5175/'))
    expect(pageKey('http://localhost:5175/article#a-routing')).toBe(
      pageKey('http://localhost:5175/article'),
    )
  })

  it('keeps the query string, which does select a different page', () => {
    expect(pageKey('http://localhost/list?page=1')).not.toBe(pageKey('http://localhost/list?page=2'))
  })

  it('resolves a relative href against the current location', () => {
    expect(pageKey('/gallery')).toBe(`${location.origin}/gallery`)
  })

  it('falls back to the raw string when the url cannot be parsed', () => {
    expect(pageKey('::: not a url')).toBe(`${location.origin}/:::%20not%20a%20url`)
  })
})
