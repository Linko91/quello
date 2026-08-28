import { describe, expect, it } from 'vitest'
import { clampToViewport, EDGE_MARGIN } from '../src/drag'

const viewport = { width: 1000, height: 800 }
const box = { width: 200, height: 40 }

describe('clampToViewport', () => {
  it('leaves a position that already fits alone', () => {
    expect(clampToViewport({ x: 300, y: 400 }, box, viewport)).toEqual({ x: 300, y: 400 })
  })

  it('pulls the box back from the right and bottom edges', () => {
    expect(clampToViewport({ x: 5000, y: 5000 }, box, viewport)).toEqual({
      x: viewport.width - box.width - EDGE_MARGIN,
      y: viewport.height - box.height - EDGE_MARGIN,
    })
  })

  it('pulls the box back from the top and left edges', () => {
    expect(clampToViewport({ x: -500, y: -500 }, box, viewport)).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
    })
  })

  it('keeps the box reachable when it is wider than the viewport', () => {
    const huge = { width: 4000, height: 3000 }
    expect(clampToViewport({ x: -900, y: -900 }, huge, viewport)).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
    })
  })
})
