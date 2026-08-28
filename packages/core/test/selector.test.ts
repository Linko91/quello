import { beforeEach, describe, expect, it } from 'vitest'
import {
  collapseText,
  domPath,
  isStableClass,
  isUsableId,
  nthOfType,
  stableClasses,
  uniqueSelector,
} from '../src/selector'

function mount(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body
}

function query(selector: string): Element {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`fixture missing: ${selector}`)
  return el
}

/** A selector is only useful if it round-trips back to the element it came from. */
function resolvesTo(el: Element): boolean {
  const selector = uniqueSelector(el)
  const found = document.querySelectorAll(selector)
  return found.length === 1 && found[0] === el
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('class')
})

describe('uniqueSelector', () => {
  it('prefers a usable id', () => {
    mount('<div id="app"><span class="a">x</span></div>')
    expect(uniqueSelector(query('#app'))).toBe('#app')
  })

  it('ignores ids that are not valid identifiers', () => {
    mount('<div id="1bad"><span>x</span></div>')
    const el = query('[id="1bad"]')
    expect(uniqueSelector(el)).not.toContain('#')
    expect(resolvesTo(el)).toBe(true)
  })

  it('uses a stable class when it is unique on the page', () => {
    mount('<main><button class="cta">Go</button></main>')
    expect(uniqueSelector(query('.cta'))).toBe('button.cta')
  })

  it('disambiguates identical siblings with nth-of-type', () => {
    mount('<ul><li class="row">a</li><li class="row">b</li><li class="row">c</li></ul>')
    const second = document.querySelectorAll('.row')[1]!
    expect(uniqueSelector(second)).toBe('li.row:nth-of-type(2)')
    expect(resolvesTo(second)).toBe(true)
  })

  it('walks up ancestors until the selector is unique', () => {
    mount(`
      <section id="left"><p class="note">one</p></section>
      <section id="right"><p class="note">two</p></section>
    `)
    const target = query('#right .note')
    expect(uniqueSelector(target)).toBe('#right > p.note')
    expect(resolvesTo(target)).toBe(true)
  })

  it('skips hashed and framework-generated classes', () => {
    mount('<div class="svelte-1a2b3c card_9f8e7d panel">hello</div>')
    const el = query('.panel')
    expect(uniqueSelector(el)).toBe('div.panel')
    expect(stableClasses(el)).toEqual(['panel'])
  })

  it('resolves elements that carry no id or usable class', () => {
    mount('<div><div><span>a</span><span>b</span></div></div>')
    const target = document.querySelectorAll('span')[1]!
    expect(resolvesTo(target)).toBe(true)
  })

  it('returns bare tag names for html and body', () => {
    mount('<div>x</div>')
    expect(uniqueSelector(document.body)).toBe('body')
    expect(uniqueSelector(document.documentElement)).toBe('html')
  })

  it('escapes classes that need escaping', () => {
    mount('<div class="w-1/2 box">x</div>')
    const el = query('.box')
    expect(resolvesTo(el)).toBe(true)
  })
})

describe('domPath', () => {
  it('describes the full ancestor chain', () => {
    mount('<div id="app"><main><button class="cta">Go</button></main></div>')
    expect(domPath(query('.cta'))).toBe('html > body > div#app > main > button.cta')
  })

  it('indexes repeated siblings', () => {
    mount('<ul><li>a</li><li>b</li></ul>')
    expect(domPath(document.querySelectorAll('li')[1]!)).toBe('html > body > ul > li[2]')
  })
})

describe('helpers', () => {
  it('validates ids', () => {
    expect(isUsableId('app')).toBe(true)
    expect(isUsableId('1app')).toBe(false)
    expect(isUsableId('')).toBe(false)
    expect(isUsableId('a b')).toBe(false)
  })

  it('rejects unstable classes', () => {
    expect(isStableClass('card')).toBe(true)
    expect(isStableClass('svelte-1a2b3c')).toBe(false)
    expect(isStableClass('css-1x2y3z')).toBe(false)
    expect(isStableClass('quello-badge')).toBe(false)
    expect(isStableClass('Button_root_a1b2c3')).toBe(false)
  })

  it('counts nth-of-type among same-tag siblings only', () => {
    mount('<div><span>a</span><b>x</b><span>b</span></div>')
    expect(nthOfType(document.querySelectorAll('span')[1]!)).toBe(2)
  })

  it('collapses and truncates text', () => {
    expect(collapseText('  hello \n  world ')).toBe('hello world')
    expect(collapseText('abcdef', 3)).toBe('abc…')
    expect(collapseText(null)).toBe('')
  })
})
