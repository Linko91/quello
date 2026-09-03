import { describe, expect, it } from 'vitest'
import type { QuelloPick } from '@quello/core'
import { filterPicks, findPick, hasNote, matchesPage, notedPicks } from '../src/picks'
import { allPicks, bare, buyButton, sidebar } from './fixtures'

describe('hasNote', () => {
  it('is true only for a note with something in it', () => {
    expect(hasNote(sidebar)).toBe(true)
    expect(hasNote(buyButton)).toBe(false)
    expect(hasNote(bare)).toBe(false)
    expect(hasNote({ ...buyButton, note: '   ' })).toBe(false)
  })
})

describe('matchesPage', () => {
  it('matches part of the url', () => {
    expect(matchesPage(buyButton, '/checkout')).toBe(true)
    expect(matchesPage(buyButton, '/settings')).toBe(false)
  })

  it('matches the title too, since that is what the user remembers', () => {
    expect(matchesPage(sidebar, 'Settings')).toBe(true)
  })

  it('ignores case', () => {
    expect(matchesPage(buyButton, 'CHECKOUT')).toBe(true)
  })

  it('matches everything on an empty needle', () => {
    expect(matchesPage(buyButton, '')).toBe(true)
    expect(matchesPage(bare, '  ')).toBe(true)
  })

  it('does not throw on a pick with no page recorded', () => {
    expect(matchesPage(bare, '/checkout')).toBe(false)
  })
})

describe('filterPicks', () => {
  it('returns everything when asked for nothing', () => {
    expect(filterPicks(allPicks)).toHaveLength(3)
    expect(filterPicks(allPicks, {})).toHaveLength(3)
  })

  it('keeps only the picks that are instructions', () => {
    expect(filterPicks(allPicks, { withNotes: true })).toEqual([sidebar])
  })

  it('keeps only the picks from one page', () => {
    expect(filterPicks(allPicks, { page: '/checkout' })).toEqual([buyButton])
  })

  it('applies both filters together', () => {
    expect(filterPicks(allPicks, { page: '/checkout', withNotes: true })).toEqual([])
    expect(filterPicks(allPicks, { page: '/settings', withNotes: true })).toEqual([sidebar])
  })

  it('treats withNotes: false as no filter at all', () => {
    expect(filterPicks(allPicks, { withNotes: false })).toHaveLength(3)
  })
})

describe('findPick', () => {
  it('finds a pick by the number the user says', () => {
    expect(findPick(allPicks, 2)).toBe(sidebar)
  })

  it('is undefined for a number that is not there', () => {
    expect(findPick(allPicks, 99)).toBeUndefined()
  })

  it('does not confuse an index with an id', () => {
    // Ids never shift after a deletion, so `1, 4` is a normal state of affairs.
    const gappy: QuelloPick[] = [{ ...buyButton, id: 4 }]
    expect(findPick(gappy, 0)).toBeUndefined()
    expect(findPick(gappy, 4)?.id).toBe(4)
  })
})

describe('notedPicks', () => {
  it('returns the noted picks in id order, which is the order to work in', () => {
    const shuffled: QuelloPick[] = [
      { ...sidebar, id: 9 },
      { ...buyButton, id: 5, note: 'first' },
      bare,
    ]
    expect(notedPicks(shuffled).map((pick) => pick.id)).toEqual([5, 9])
  })

  it('is empty when nothing has been noted', () => {
    expect(notedPicks([buyButton, bare])).toEqual([])
  })

  it('leaves the array it was given alone', () => {
    const input = [{ ...sidebar, id: 9 }, { ...buyButton, id: 5, note: 'x' }]
    notedPicks(input)
    expect(input.map((pick) => pick.id)).toEqual([9, 5])
  })
})
