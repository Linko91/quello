/**
 * All quello UI lives inside a single shadow root so that the host page's
 * styles cannot leak in and quello's styles cannot leak out.
 */

const HOST_TAG = 'quello-overlay'
const Z_INDEX = 2147483647

const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }

.layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: ${Z_INDEX};
}

.highlight {
  position: fixed;
  border: 2px solid #7c5cff;
  background: rgba(124, 92, 255, 0.12);
  border-radius: 3px;
  transition: all 60ms linear;
  pointer-events: none;
}

.tip {
  position: fixed;
  max-width: 320px;
  padding: 3px 7px;
  border-radius: 4px;
  background: #7c5cff;
  color: #fff;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.badge {
  position: fixed;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border: 2px solid #fff;
  border-radius: 11px;
  background: #7c5cff;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
}
.badge:hover { background: #ef4444; }
.badge:hover::after { content: "×"; margin-left: 4px; font-size: 13px; }

.marker {
  position: fixed;
  border: 1.5px dashed rgba(124, 92, 255, 0.85);
  border-radius: 3px;
  pointer-events: none;
}

.toolbar {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: ${Z_INDEX};
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 999px;
  background: #17161d;
  color: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  pointer-events: auto;
}

button {
  border: 0;
  border-radius: 999px;
  background: #2a2833;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  cursor: pointer;
}
button:hover { background: #37343f; }
button.primary[data-on="true"] { background: #7c5cff; }
button.primary[data-on="true"]:hover { background: #6b4cf0; }

.count {
  padding: 0 8px 0 4px;
  font-size: 11px;
  opacity: 0.65;
  white-space: nowrap;
}
`

export interface OverlayHandlers {
  onToggle(): void
  onClear(): void
  onRemovePick(id: number): void
}

export interface BadgeTarget {
  id: number
  element: Element
}

interface BadgeNodes {
  badge: HTMLElement
  marker: HTMLElement
}

export class Overlay {
  readonly host: HTMLElement
  private readonly root: ShadowRoot
  private readonly layer: HTMLElement
  private readonly highlight: HTMLElement
  private readonly tip: HTMLElement
  private readonly toggleButton: HTMLButtonElement
  private readonly clearButton: HTMLButtonElement
  private readonly count: HTMLElement
  private readonly nodes = new Map<number, BadgeNodes>()
  private targets: BadgeTarget[] = []
  private frame: number | null = null

  constructor(private readonly handlers: OverlayHandlers) {
    this.host = document.createElement(HOST_TAG)
    this.host.setAttribute('data-quello', 'root')
    this.root = this.host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = STYLES

    this.layer = el('div', 'layer')
    this.highlight = el('div', 'highlight')
    this.tip = el('div', 'tip')
    this.highlight.hidden = true
    this.tip.hidden = true
    this.layer.append(this.highlight, this.tip)

    const toolbar = el('div', 'toolbar')
    this.toggleButton = document.createElement('button')
    this.toggleButton.className = 'primary'
    this.toggleButton.dataset.on = 'false'
    this.toggleButton.textContent = 'quello'
    this.toggleButton.title = 'Toggle element picker (Alt+Q)'
    this.toggleButton.addEventListener('click', () => this.handlers.onToggle())

    this.clearButton = document.createElement('button')
    this.clearButton.textContent = 'Clear all'
    this.clearButton.hidden = true
    this.clearButton.addEventListener('click', () => this.handlers.onClear())

    this.count = el('span', 'count')
    this.count.hidden = true

    toolbar.append(this.toggleButton, this.count, this.clearButton)
    this.root.append(style, this.layer, toolbar)
  }

  mount(): void {
    document.body.appendChild(this.host)
  }

  setEnabled(enabled: boolean): void {
    this.toggleButton.dataset.on = String(enabled)
    this.toggleButton.textContent = enabled ? 'picking…' : 'quello'
    if (!enabled) this.clearHover()
  }

  setHover(element: Element, label: string): void {
    const rect = element.getBoundingClientRect()
    this.highlight.hidden = false
    place(this.highlight, rect.left, rect.top, rect.width, rect.height)

    this.tip.hidden = false
    this.tip.textContent = label
    const above = rect.top > 22
    this.tip.style.left = `${Math.max(2, rect.left)}px`
    this.tip.style.top = `${above ? rect.top - 21 : rect.bottom + 3}px`
  }

  clearHover(): void {
    this.highlight.hidden = true
    this.tip.hidden = true
  }

  /** Re-render badges for the given picks and keep them anchored to their elements. */
  setPicks(targets: BadgeTarget[]): void {
    this.targets = targets
    const seen = new Set(targets.map((t) => t.id))
    for (const [id, node] of this.nodes) {
      if (seen.has(id)) continue
      node.badge.remove()
      node.marker.remove()
      this.nodes.delete(id)
    }

    for (const target of targets) {
      if (this.nodes.has(target.id)) continue
      const badge = el('div', 'badge')
      badge.textContent = String(target.id)
      badge.title = `PICK ${target.id} — click to remove`
      badge.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.handlers.onRemovePick(target.id)
      })
      const marker = el('div', 'marker')
      this.layer.append(marker, badge)
      this.nodes.set(target.id, { badge, marker })
    }

    this.count.hidden = targets.length === 0
    this.count.textContent = targets.length === 1 ? '1 pick' : `${targets.length} picks`
    this.clearButton.hidden = targets.length === 0

    this.reposition()
    if (targets.length > 0) this.startTracking()
    else this.stopTracking()
  }

  private reposition(): void {
    for (const target of this.targets) {
      const node = this.nodes.get(target.id)
      if (!node) continue
      const rect = target.element.getBoundingClientRect()
      const visible = rect.width > 0 || rect.height > 0
      node.marker.style.display = visible ? '' : 'none'
      node.badge.style.display = visible ? '' : 'none'
      if (!visible) continue
      place(node.marker, rect.left, rect.top, rect.width, rect.height)
      node.badge.style.left = `${Math.max(2, rect.left - 8)}px`
      node.badge.style.top = `${Math.max(2, rect.top - 8)}px`
    }
  }

  private startTracking(): void {
    if (this.frame !== null) return
    const tick = (): void => {
      this.reposition()
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private stopTracking(): void {
    if (this.frame === null) return
    cancelAnimationFrame(this.frame)
    this.frame = null
  }

  destroy(): void {
    this.stopTracking()
    this.host.remove()
  }
}

function el(tag: string, className: string): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  return node
}

function place(node: HTMLElement, left: number, top: number, width: number, height: number): void {
  node.style.left = `${left}px`
  node.style.top = `${top}px`
  node.style.width = `${width}px`
  node.style.height = `${height}px`
}
