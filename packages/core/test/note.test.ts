import { describe, expect, it } from 'vitest'
import { withNote } from '../src/picker'
import type { QuelloPick } from '../src/types'

const base = {
  id: 2,
  label: 'PICK 2',
  selector: 'button.cta',
  domPath: 'body > button.cta',
  tag: 'button',
  classes: ['cta'],
  attributes: {},
  text: 'Send',
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
} satisfies QuelloPick

describe('withNote', () => {
  it('adds the note right after the label, where it is easy to read', () => {
    const keys = Object.keys(withNote(base, 'make this red'))
    expect(keys.slice(0, 3)).toEqual(['id', 'label', 'note'])
  })

  it('keeps every other field, and their order', () => {
    const noted = withNote(base, 'make this red')
    expect(noted.selector).toBe('button.cta')
    expect(Object.keys(noted).filter((k) => k !== 'note')).toEqual(Object.keys(base))
  })

  it('trims surrounding whitespace', () => {
    expect(withNote(base, '   tighten the padding \n').note).toBe('tighten the padding')
  })

  it('omits the field entirely for an empty note', () => {
    expect('note' in withNote(base, '')).toBe(false)
    expect('note' in withNote(base, '   \n  ')).toBe(false)
  })

  it('clears a note that was there before', () => {
    const noted = withNote(base, 'first')
    expect('note' in withNote(noted, '')).toBe(false)
  })

  it('replaces a note without duplicating the key', () => {
    const noted = withNote(withNote(base, 'first'), 'second')
    expect(noted.note).toBe('second')
    expect(Object.keys(noted).filter((k) => k === 'note')).toHaveLength(1)
  })

  it('leaves multi-line notes intact', () => {
    expect(withNote(base, 'do this\nthen that').note).toBe('do this\nthen that')
  })
})
