import { clampToViewport, draggable, EDGE_MARGIN } from './drag'
import { MAX_HTML_LIMIT, MIN_HTML_LIMIT } from './settings'
import type { QuelloHtmlMode, QuelloPoint, QuelloSettings } from './types'

/**
 * All quello UI lives inside a single shadow root so that the host page's
 * styles cannot leak in and quello's styles cannot leak out.
 */

const HOST_TAG = 'quello-overlay'
const Z_INDEX = 2147483647

/** Distance the toolbar keeps from the corner when it has never been dragged. */
const PARKED_INSET = 16

const PANEL_GAP = 8

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

.dock {
  position: fixed;
  right: ${PARKED_INSET}px;
  bottom: ${PARKED_INSET}px;
  z-index: ${Z_INDEX};
  pointer-events: auto;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 999px;
  background: #17161d;
  color: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}
.toolbar[hidden], .puck[hidden], .panel[hidden], .tally[hidden] { display: none; }

.grip {
  padding: 0 4px 0 6px;
  font-size: 13px;
  line-height: 1;
  color: #fff;
  opacity: 0.35;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.grip:active { cursor: grabbing; opacity: 0.6; }

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
button.icon { padding: 7px 10px; font-size: 13px; line-height: 1; }
button.icon[data-on="true"] { background: #37343f; }

.count {
  padding: 0 8px 0 4px;
  font-size: 11px;
  opacity: 0.65;
  white-space: nowrap;
}

/* Compact form: one puck that is both the drag handle and the expand button. */
.puck {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid #2a2833;
  background: #17161d;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.puck:active { cursor: grabbing; }
.puck[data-on="true"] { background: #7c5cff; border-color: #7c5cff; }

.tally {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border: 2px solid #0f0e13;
  border-radius: 9px;
  background: #7c5cff;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.puck[data-on="true"] .tally { background: #fff; color: #7c5cff; }

.panel {
  position: fixed;
  z-index: ${Z_INDEX};
  width: 232px;
  padding: 12px;
  border: 1px solid #2a2833;
  border-radius: 10px;
  background: #17161d;
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}

.panel h2 {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.5;
}

.field { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 12px; cursor: pointer; }
.field input { accent-color: #7c5cff; margin: 0; cursor: pointer; }
.field .note { display: block; font-size: 11px; opacity: 0.5; }

.limit {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0 22px;
  font-size: 11px;
  opacity: 0.75;
}
.limit[data-disabled="true"] { opacity: 0.3; pointer-events: none; }
.limit input {
  width: 74px;
  padding: 4px 6px;
  border: 1px solid #37343f;
  border-radius: 6px;
  background: #0f0e13;
  color: #fff;
  font: inherit;
}
`

export interface OverlayHandlers {
  onToggle(): void
  onClear(): void
  onRemovePick(id: number): void
  onSettingsChange(patch: Partial<QuelloSettings>): void
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

  private readonly dock: HTMLElement
  private readonly toolbar: HTMLElement
  private readonly puck: HTMLElement
  private readonly tally: HTMLElement
  private readonly toggleButton: HTMLButtonElement
  private readonly clearButton: HTMLButtonElement
  private readonly settingsButton: HTMLButtonElement
  private readonly count: HTMLElement

  private readonly panel: HTMLElement
  private readonly modeInputs = new Map<QuelloHtmlMode, HTMLInputElement>()
  private readonly limitRow: HTMLElement
  private readonly limitInput: HTMLInputElement

  private readonly nodes = new Map<number, BadgeNodes>()
  private readonly teardown: Array<() => void> = []
  private targets: BadgeTarget[] = []
  private frame: number | null = null
  private position: QuelloPoint | null = null
  private compact = false

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

    const grip = el('span', 'grip')
    grip.textContent = '⠿'
    grip.title = 'Drag to move'

    this.toggleButton = button('primary', 'quello', 'Toggle element picker (Alt+Q)')
    this.toggleButton.dataset.on = 'false'
    this.toggleButton.addEventListener('click', () => this.handlers.onToggle())

    this.clearButton = button('', 'Clear all', 'Remove every pick')
    this.clearButton.hidden = true
    this.clearButton.addEventListener('click', () => this.handlers.onClear())

    this.count = el('span', 'count')
    this.count.hidden = true

    this.settingsButton = button('icon', '⚙', 'Settings')
    this.settingsButton.setAttribute('aria-label', 'Settings')
    this.settingsButton.addEventListener('click', () => this.togglePanel())

    const collapseButton = button('icon', '–', 'Collapse the toolbar')
    collapseButton.setAttribute('aria-label', 'Collapse the toolbar')
    collapseButton.addEventListener('click', () => this.setCompact(true))

    this.toolbar = el('div', 'toolbar')
    this.toolbar.append(
      grip,
      this.toggleButton,
      this.count,
      this.clearButton,
      this.settingsButton,
      collapseButton,
    )

    this.puck = el('div', 'puck')
    this.puck.dataset.on = 'false'
    this.puck.title = 'quello — click to expand, drag to move'
    this.puck.append(document.createTextNode('Q'))
    this.tally = el('span', 'tally')
    this.tally.hidden = true
    this.puck.append(this.tally)
    this.puck.hidden = true

    this.dock = el('div', 'dock')
    this.dock.append(this.toolbar, this.puck)

    const panel = this.buildPanel()
    this.panel = panel.root
    this.limitRow = panel.limitRow
    this.limitInput = panel.limitInput

    this.root.append(style, this.layer, this.panel, this.dock)

    this.teardown.push(
      draggable(grip, this.dragOptions()),
      draggable(this.puck, { ...this.dragOptions(), onClick: () => this.setCompact(false) }),
    )
    window.addEventListener('resize', this.onResize)
    this.teardown.push(() => window.removeEventListener('resize', this.onResize))
  }

  mount(): void {
    document.body.appendChild(this.host)
    this.applyLayout()
  }

  // --- toolbar placement -------------------------------------------------

  private dragOptions() {
    return {
      origin: (): QuelloPoint => {
        const rect = this.dock.getBoundingClientRect()
        return { x: rect.left, y: rect.top }
      },
      size: (): { width: number; height: number } => {
        const rect = this.dock.getBoundingClientRect()
        return { width: rect.width, height: rect.height }
      },
      onMove: (point: QuelloPoint): void => {
        this.position = point
        this.applyLayout()
      },
      onDrop: (point: QuelloPoint): void => {
        this.position = point
        this.applyLayout()
        this.handlers.onSettingsChange({ toolbarPosition: point })
      },
    }
  }

  private setCompact(compact: boolean): void {
    if (this.compact === compact) return
    // Collapsing shrinks the dock from the left; keeping its right edge put means
    // the puck appears where the toolbar's controls just were, not somewhere else.
    const before = this.dock.getBoundingClientRect()
    this.compact = compact
    if (compact) this.togglePanel(false)
    this.applyLayout()

    if (this.position) {
      const after = this.dock.getBoundingClientRect()
      this.position = { x: this.position.x + (before.width - after.width), y: this.position.y }
      this.applyLayout()
    }
    this.handlers.onSettingsChange({ toolbarCompact: compact, toolbarPosition: this.position })
  }

  private applyLayout(): void {
    this.toolbar.hidden = this.compact
    this.puck.hidden = !this.compact

    if (!this.position) {
      Object.assign(this.dock.style, {
        left: 'auto',
        top: 'auto',
        right: `${PARKED_INSET}px`,
        bottom: `${PARKED_INSET}px`,
      })
    } else {
      const rect = this.dock.getBoundingClientRect()
      // Write the clamped value back, so what gets persisted is always what is shown.
      const point = clampToViewport(this.position, { width: rect.width, height: rect.height })
      this.position = point
      Object.assign(this.dock.style, {
        left: `${point.x}px`,
        top: `${point.y}px`,
        right: 'auto',
        bottom: 'auto',
      })
    }
    if (this.panelOpen) this.positionPanel()
  }

  /** Park the panel against the toolbar, flipping below it when there is no room above. */
  private positionPanel(): void {
    const dock = this.dock.getBoundingClientRect()
    const panel = this.panel.getBoundingClientRect()

    const above = dock.top - panel.height - PANEL_GAP
    const top = above >= EDGE_MARGIN ? above : dock.bottom + PANEL_GAP
    const left = Math.min(
      Math.max(EDGE_MARGIN, dock.right - panel.width),
      Math.max(EDGE_MARGIN, window.innerWidth - panel.width - EDGE_MARGIN),
    )
    this.panel.style.left = `${left}px`
    this.panel.style.top = `${top}px`
  }

  private readonly onResize = (): void => {
    this.applyLayout()
  }

  // --- settings panel ----------------------------------------------------

  private buildPanel(): { root: HTMLElement; limitRow: HTMLElement; limitInput: HTMLInputElement } {
    const root = el('div', 'panel')
    root.hidden = true

    const heading = document.createElement('h2')
    heading.textContent = 'HTML in picks'
    root.append(heading)

    const options: Array<{ mode: QuelloHtmlMode; label: string; note: string }> = [
      { mode: 'none', label: 'None', note: 'No html field' },
      { mode: 'truncated', label: 'Truncated', note: 'Middle elided to fit' },
      { mode: 'full', label: 'Full', note: 'Complete outerHTML' },
    ]

    for (const option of options) {
      const field = document.createElement('label')
      field.className = 'field'
      const input = document.createElement('input')
      input.type = 'radio'
      input.name = 'quello-html-mode'
      input.value = option.mode
      input.addEventListener('change', () => {
        if (input.checked) this.handlers.onSettingsChange({ htmlMode: option.mode })
      })
      const text = document.createElement('span')
      text.textContent = option.label
      const note = el('span', 'note')
      note.textContent = option.note
      text.append(note)
      field.append(input, text)
      root.append(field)
      this.modeInputs.set(option.mode, input)
    }

    const limitRow = el('div', 'limit')
    const limitLabel = document.createElement('label')
    limitLabel.textContent = 'max'
    const limitInput = document.createElement('input')
    limitInput.type = 'number'
    limitInput.min = String(MIN_HTML_LIMIT)
    limitInput.max = String(MAX_HTML_LIMIT)
    limitInput.step = '50'
    limitInput.setAttribute('aria-label', 'Maximum HTML characters')
    limitInput.addEventListener('change', () => {
      this.handlers.onSettingsChange({ htmlLimit: Number(limitInput.value) })
    })
    const unit = document.createElement('span')
    unit.textContent = 'chars'
    limitLabel.append(limitInput)
    limitRow.append(limitLabel, unit)
    root.append(limitRow)

    return { root, limitRow, limitInput }
  }

  get panelOpen(): boolean {
    return !this.panel.hidden
  }

  togglePanel(open = this.panel.hidden): void {
    this.panel.hidden = !open
    this.settingsButton.dataset.on = String(open)
    if (open) this.positionPanel()
  }

  /** Render the toolbar and panel from the settings the picker actually holds. */
  setSettings(settings: QuelloSettings): void {
    for (const [mode, input] of this.modeInputs) input.checked = mode === settings.htmlMode
    this.limitInput.value = String(settings.htmlLimit)
    this.limitRow.dataset.disabled = String(settings.htmlMode !== 'truncated')

    this.position = settings.toolbarPosition
    this.compact = settings.toolbarCompact
    this.applyLayout()
  }

  // --- picking feedback --------------------------------------------------

  setEnabled(enabled: boolean): void {
    this.toggleButton.dataset.on = String(enabled)
    this.toggleButton.textContent = enabled ? 'picking…' : 'quello'
    this.puck.dataset.on = String(enabled)
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
    this.tally.hidden = targets.length === 0
    this.tally.textContent = String(targets.length)

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
    for (const off of this.teardown) off()
    this.host.remove()
  }
}

function el(tag: string, className: string): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  return node
}

function button(className: string, label: string, title: string): HTMLButtonElement {
  const node = document.createElement('button')
  if (className) node.className = className
  node.textContent = label
  node.title = title
  return node
}

function place(node: HTMLElement, left: number, top: number, width: number, height: number): void {
  node.style.left = `${left}px`
  node.style.top = `${top}px`
  node.style.width = `${width}px`
  node.style.height = `${height}px`
}
