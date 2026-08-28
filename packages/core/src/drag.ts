/** Pointer travel below this is a click, not a drag. */
const CLICK_SLOP = 4

/** Keeps a dragged element this far from the viewport edges. */
export const EDGE_MARGIN = 8

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

/** Confine a top-left position so the whole box stays reachable on screen. */
export function clampToViewport(
  position: Point,
  size: Size,
  viewport: Size = { width: window.innerWidth, height: window.innerHeight },
): Point {
  const maxX = Math.max(EDGE_MARGIN, viewport.width - size.width - EDGE_MARGIN)
  const maxY = Math.max(EDGE_MARGIN, viewport.height - size.height - EDGE_MARGIN)
  return {
    x: Math.min(maxX, Math.max(EDGE_MARGIN, position.x)),
    y: Math.min(maxY, Math.max(EDGE_MARGIN, position.y)),
  }
}

export interface DragOptions {
  /** Current top-left of the moved element, read when the drag starts. */
  origin(): Point
  /** Size used to keep the element inside the viewport. */
  size(): Size
  /** Continuous, while the pointer moves. */
  onMove(position: Point): void
  /** Once, when a real drag ends. */
  onDrop(position: Point): void
  /** Once, when the pointer is released without meaningful movement. */
  onClick?(): void
}

/**
 * Make `handle` drag something. The handle can double as a button: a release
 * that never travelled past the slop is reported through `onClick` instead.
 * Returns a teardown function.
 */
export function draggable(handle: HTMLElement, options: DragOptions): () => void {
  let start: Point | null = null
  let origin: Point = { x: 0, y: 0 }
  let moved = false

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    start = { x: event.clientX, y: event.clientY }
    origin = options.origin()
    moved = false
    // Capture keeps the moves coming even when the pointer outruns the handle.
    // It can legitimately fail (no active pointer), and the drag still works without it.
    try {
      handle.setPointerCapture(event.pointerId)
    } catch {
      /* not capturable */
    }
    event.preventDefault()
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!moved && Math.abs(dx) < CLICK_SLOP && Math.abs(dy) < CLICK_SLOP) return
    moved = true
    options.onMove(clampToViewport({ x: origin.x + dx, y: origin.y + dy }, options.size()))
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const wasDrag = moved
    start = null
    moved = false
    try {
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    if (wasDrag) options.onDrop(clampToViewport({ x: origin.x + dx, y: origin.y + dy }, options.size()))
    else options.onClick?.()
  }

  handle.addEventListener('pointerdown', onPointerDown)
  handle.addEventListener('pointermove', onPointerMove)
  handle.addEventListener('pointerup', onPointerUp)
  handle.addEventListener('pointercancel', onPointerUp)

  return () => {
    handle.removeEventListener('pointerdown', onPointerDown)
    handle.removeEventListener('pointermove', onPointerMove)
    handle.removeEventListener('pointerup', onPointerUp)
    handle.removeEventListener('pointercancel', onPointerUp)
  }
}
