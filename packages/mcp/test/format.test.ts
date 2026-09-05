import { describe, expect, it } from 'vitest'
import {
  describePick,
  describeSource,
  formatPickList,
  formatResolvePlan,
  locationOf,
  oneLine,
  pickName,
  summarizePick,
} from '../src/format'
import { allPicks, bare, buyButton, sidebar } from './fixtures'

describe('oneLine', () => {
  it('collapses whitespace so a line stays a line', () => {
    expect(oneLine('  a\n\tb   c ')).toBe('a b c')
  })

  it('truncates with an ellipsis, staying within the limit', () => {
    const out = oneLine('abcdefghij', 5)
    expect(out).toBe('abcd…')
    expect(out).toHaveLength(5)
  })

  it('leaves text that already fits alone', () => {
    expect(oneLine('abc', 5)).toBe('abc')
  })
})

describe('pickName', () => {
  it('is what the user says out loud', () => {
    expect(pickName(sidebar)).toBe('PICK 2')
  })
})

describe('locationOf', () => {
  it('gives file and line, which is what an agent can jump to', () => {
    expect(locationOf(buyButton)).toBe('src/components/BuyButton.vue:12 (BuyButton)')
  })

  it('includes the column when the framework exposes one', () => {
    expect(locationOf(sidebar)).toBe('src/Sidebar.svelte:3:5 (Sidebar)')
  })

  it('falls back to the component name when there is no file', () => {
    expect(locationOf({ ...buyButton, framework: { framework: 'react', component: 'Card' } })).toBe(
      'Card',
    )
  })

  it('falls back to the file alone when there is no line', () => {
    expect(
      locationOf({ ...buyButton, framework: { framework: 'react', file: 'src/Card.tsx' } }),
    ).toBe('src/Card.tsx')
  })

  it('falls back to the selector when the framework is unknown', () => {
    expect(locationOf(bare)).toBe('#footer')
    expect(locationOf({ ...buyButton, framework: null })).toBe('.cta > button')
  })

  it('falls back to the selector when the framework knows nothing useful', () => {
    expect(locationOf({ ...bare, framework: { framework: 'angular' } })).toBe('#footer')
  })
})

describe('summarizePick', () => {
  it('puts the label, element, source, text and note on one line', () => {
    const line = summarizePick(sidebar)
    expect(line).toContain('PICK 2')
    expect(line).toContain('<aside class="sidebar">')
    expect(line).toContain('src/Sidebar.svelte:3:5')
    expect(line).toContain('"Filters"')
    expect(line).toContain('note: make this sticky on scroll')
    expect(line.split('\n')).toHaveLength(1)
  })

  it('says nothing about a note when there is none', () => {
    expect(summarizePick(buyButton)).not.toContain('note:')
  })

  it('survives a pick with only an id and a selector', () => {
    expect(summarizePick(bare)).toBe('PICK 3 · #footer')
  })

  it('does not print the selector twice when it is both the element and the location', () => {
    expect(summarizePick(bare).match(/#footer/g)).toHaveLength(1)
  })
})

describe('describePick', () => {
  const described = describePick(buyButton)

  it('leads with the label', () => {
    expect(described.split('\n')[0]).toBe('PICK 1 — Buy now')
  })

  it('puts the source above the rest, as the field to act on first', () => {
    const rows = described.split('\n')
    expect(rows[1]).toContain('source')
    expect(rows[1]).toContain('src/components/BuyButton.vue:12')
  })

  it('puts the note first of all, when there is one', () => {
    const rows = describePick(sidebar).split('\n')
    expect(rows[1]).toContain('note')
    expect(rows[1]).toContain('make this sticky on scroll')
  })

  it('carries every recorded field', () => {
    for (const label of [
      'framework',
      'selector',
      'dom path',
      'tag',
      'classes',
      'text',
      'attributes',
      'page',
      'box',
      'style',
      'picked at',
    ]) {
      expect(described).toContain(label)
    }
  })

  it('writes the style as CSS, not as the camelCase the type uses', () => {
    expect(described).toContain('font-weight: 600')
    expect(described).toContain('border-radius: 6px')
    expect(described).not.toContain('fontWeight')
  })

  it('leaves out a style property the browser reported as empty', () => {
    expect(describePick(sidebar)).not.toContain('gap:')
  })

  it('renders a valueless attribute as the bare name', () => {
    expect(described).toContain('disabled')
    expect(described).not.toContain('disabled=""')
  })

  it('gives the box as width×height at x,y', () => {
    expect(described).toContain('320×44 at 12,220')
  })

  it('includes html only when the developer enabled capturing it', () => {
    expect(described).not.toContain('html')
    expect(describePick({ ...buyButton, html: '<button>Buy now</button>' })).toContain(
      'html        <button>Buy now</button>',
    )
  })

  it('omits every row it has no value for, rather than printing blanks', () => {
    const rows = describePick(bare).split('\n')
    expect(rows[0]).toBe('PICK 3')
    expect(rows).toHaveLength(3)
    expect(describePick(bare)).toContain('selector    #footer')
  })
})

describe('describeSource', () => {
  it('says where the picks came from and when they were written', () => {
    expect(describeSource('/app/.quello/picks.json', '2026-09-03T10:00:00.000Z')).toBe(
      '/app/.quello/picks.json · updated 2026-09-03T10:00:00.000Z',
    )
  })

  it('is just the path when there is no timestamp to give', () => {
    expect(describeSource('/app/.quello/picks.json', undefined)).toBe('/app/.quello/picks.json')
  })
})

describe('formatPickList', () => {
  it('counts the picks and lists one per line', () => {
    const out = formatPickList(allPicks)
    expect(out).toContain('3 picks:')
    expect(out).toContain('PICK 1')
    expect(out).toContain('PICK 2')
    expect(out).toContain('PICK 3')
  })

  it('says "1 pick", not "1 picks"', () => {
    expect(formatPickList([buyButton])).toContain('1 pick:')
  })

  it('expands every field when asked for full detail', () => {
    const out = formatPickList([buyButton], { detail: 'full' })
    expect(out).toContain('dom path')
    expect(out).toContain('style')
  })

  it('shows the source header when given one', () => {
    expect(formatPickList(allPicks, { source: '/app/picks.json' })).toContain('/app/picks.json')
  })

  it('explains how to make a pick when there are none at all', () => {
    const out = formatPickList([])
    expect(out).toContain('No picks yet')
    expect(out).toContain('Alt+Q')
  })

  it('says what it filtered by when a filter matched nothing', () => {
    expect(formatPickList([], { scope: 'with a note' })).toContain('No picks with a note.')
  })

  it('repeats the scope alongside the count when a filter did match', () => {
    expect(formatPickList([sidebar], { scope: 'with a note' })).toContain('1 pick with a note:')
  })
})

describe('formatResolvePlan', () => {
  const plan = formatResolvePlan(allPicks)

  it('numbers the noted picks and names the source to open', () => {
    expect(plan).toContain('1 pick to resolve, in order:')
    expect(plan).toContain('1. PICK 2 — src/Sidebar.svelte:3:5 (Sidebar)')
    expect(plan).toContain('note: make this sticky on scroll')
  })

  it('carries the element and the page, so the note has a subject', () => {
    expect(plan).toContain('element: <aside class="sidebar">')
    expect(plan).toContain('page: Settings — http://localhost:5173/settings')
  })

  it('works through the notes in id order, whatever order the file was in', () => {
    const out = formatResolvePlan([
      { ...sidebar, id: 9, note: 'last' },
      { ...buyButton, id: 4, note: 'first' },
    ])
    expect(out.indexOf('PICK 4')).toBeLessThan(out.indexOf('PICK 9'))
  })

  it('says what to do with the notes, and what not to do with the file', () => {
    expect(plan).toContain('report what you changed per pick')
    expect(plan).toContain('Do not edit the picks file')
  })

  it('accounts for the bookmarks it is leaving alone', () => {
    expect(plan).toContain('2 other picks are bookmarks with no note')
  })

  it('gets the grammar right for a single bookmark', () => {
    expect(formatResolvePlan([sidebar, bare])).toContain('1 other pick is a bookmark')
  })

  it('says nothing about bookmarks when every pick has a note', () => {
    expect(formatResolvePlan([sidebar])).not.toContain('bookmark')
  })

  it('distinguishes no picks from no notes', () => {
    expect(formatResolvePlan([])).toContain('No picks yet')
    const bookmarksOnly = formatResolvePlan([buyButton, bare])
    expect(bookmarksOnly).toContain('None of the 2 picks carries a note')
    expect(bookmarksOnly).toContain('ask the user')
  })
})
