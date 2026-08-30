import { logoSvg, markSvg } from './brand'
import { clampToViewport, draggable, EDGE_MARGIN } from './drag'
import { PicksList, PICKS_LIST_STYLES } from './picks-list'
import { applyTheme } from './theme'
import type { QuelloTheme } from './theme'
import type { PickRow } from './picks-list'
import { MAX_HTML_LIMIT, MIN_HTML_LIMIT } from './settings'
import type {
  QuelloCopyScope,
  QuelloHtmlMode,
  QuelloPick,
  QuelloPoint,
  QuelloSettings,
} from './types'

/**
 * All quello UI lives inside a single shadow root so that the host page's
 * styles cannot leak in and quello's styles cannot leak out.
 */

const HOST_TAG = 'quello-overlay'
const Z_INDEX = 2147483647

/** Distance the toolbar keeps from the corner when it has never been dragged. */
const PARKED_INSET = 16

const PANEL_GAP = 8

const STYLES = `${PICKS_LIST_STYLES}

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
  border: var(--quello-hover-border-width, 2px) solid var(--quello-hover-color, #7c5cff);
  /* The fill is derived from the hover colour, not configured separately. The
     literal first is the fallback where color-mix is unavailable. */
  background: rgba(124, 92, 255, 0.12);
  background: color-mix(in srgb, var(--quello-hover-color, #7c5cff) 12%, transparent);
  border-radius: 3px;
  /* No transition: the outline is re-placed every frame to follow scrolling, and
     an easing would leave it trailing the element it is supposed to be marking. */
  pointer-events: none;
}

.tip {
  position: fixed;
  max-width: 320px;
  padding: 3px 7px;
  border-radius: 4px;
  /* The label belongs to the hover outline, so it takes its colour. */
  background: var(--quello-hover-color, #7c5cff);
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
.badge:hover { background: #6b4cf0; }
.badge:hover::after { content: "✎"; margin-left: 4px; font-size: 11px; }

/* A pick that carries a note is marked, so notes are visible without opening them. */
.badge[data-note="true"] { border-color: #ffd166; }
.badge[data-note="true"]::before {
  content: "";
  position: absolute;
  top: -3px;
  right: -3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffd166;
}

.note-editor {
  position: fixed;
  z-index: ${Z_INDEX};
  width: 264px;
  padding: 10px;
  border: 1px solid #2a2833;
  border-radius: 10px;
  background: #17161d;
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}
.note-editor h3 {
  margin: 0 0 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.5;
}
.note-editor textarea {
  width: 100%;
  /* Grows with what is typed, where the browser supports it; the min-height keeps
     the box usable everywhere else. */
  field-sizing: content;
  min-height: 66px;
  max-height: 40vh;
  scrollbar-width: thin;
  scrollbar-color: #3a3745 transparent;
  padding: 7px 9px;
  border: 1px solid #37343f;
  border-radius: 7px;
  background: #0f0e13;
  color: #fff;
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
}
.note-editor textarea:focus { outline: none; border-color: #7c5cff; }
.note-editor textarea::-webkit-scrollbar { width: 9px; }
.note-editor textarea::-webkit-scrollbar-track { background: transparent; }
.note-editor textarea::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background: #3a3745;
  background-clip: padding-box;
}
.note-editor .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
.note-editor .hint { font-size: 10px; opacity: 0.4; line-height: 1.4; }
.note-editor button { padding: 5px 10px; font-size: 11px; white-space: nowrap; }
.note-editor button.danger { background: transparent; color: #ef4444; }
.note-editor button.danger:hover { background: #2a1c1e; }

.marker {
  position: fixed;
  border: var(--quello-picked-border-width, 1.5px) var(--quello-picked-border-style, dashed)
    var(--quello-picked-border-color, rgba(124, 92, 255, 0.85));
  background: var(--quello-picked-fill, transparent);
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
.toolbar[hidden], .puck[hidden], .panel[hidden], .tally[hidden], .toast[hidden],
.note-editor[hidden] { display: none; }

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
button.primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Wide enough for the wordmark, so swapping in "picking…" does not shuffle
     everything to its right. */
  min-width: 83px;
  /* Asymmetric on purpose: the wordmark's box includes the q's descender, so
     centring it geometrically leaves the letters sitting high. */
  padding: 9px 11px 5px;
}
/* The text has no descender to allow for, so it centres normally. */
button.primary[data-on="true"] { padding: 7px 12px; }
button.primary[data-on="true"] { background: #7c5cff; }
button.primary[data-on="true"]:hover { background: #6b4cf0; }
button.icon { padding: 7px 10px; font-size: 13px; line-height: 1; }
button.icon[data-on="true"] { background: #37343f; }

button.count {
  padding: 6px 9px;
  border-radius: 999px;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  opacity: 0.65;
  white-space: nowrap;
}
button.count:hover { background: #2a2833; opacity: 1; }
button.count[data-on="true"] { background: #2a2833; opacity: 1; }
button.count[hidden] { display: none; }

/* Compact form: one puck that is both the drag handle and the expand button. */
.puck {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid #2a2833;
  background: #17161d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.puck:active { cursor: grabbing; }
/* The descender sits below the optical centre, so the mark is nudged up. */
.puck .mark { display: flex; margin-top: -1px; }
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

.toast {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  padding: 5px 10px;
  border-radius: 999px;
  background: #7c5cff;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
.toast[data-failed="true"] { background: #ef4444; }
.dock[data-flip="true"] .toast { bottom: auto; top: calc(100% + 8px); }

.panel h2 {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.5;
}

.limit + h2, .scopes + h2 { margin-top: 14px; }

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

.scopes { margin-left: 22px; }
.scopes .field { padding: 3px 0; }
.scopes[data-disabled="true"] { opacity: 0.3; pointer-events: none; }
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
  onNoteChange(id: number, note: string): void
  onScrollToPick(id: number): void
  onCopyPick(id: number): void
  onSettingsChange(patch: Partial<QuelloSettings>): void
}

export interface OverlayOptions {
  /** Rendered into the tooltips, so they name whatever combination is configured. */
  shortcutLabel?: string
  theme?: QuelloTheme
}

export interface BadgeTarget {
  id: number
  element: Element
  note?: string
}

interface BadgeNodes {
  badge: HTMLElement
  marker: HTMLElement
}

export class Overlay {
  readonly host: HTMLElement
  private readonly shortcutLabel: string
  private readonly root: ShadowRoot
  private readonly layer: HTMLElement
  private readonly highlight: HTMLElement
  private readonly tip: HTMLElement

  private readonly dock: HTMLElement
  private readonly toolbar: HTMLElement
  private readonly puck: HTMLElement
  private readonly tally: HTMLElement
  private readonly toast: HTMLElement
  private readonly toggleButton: HTMLButtonElement
  private readonly clearButton: HTMLButtonElement
  private readonly settingsButton: HTMLButtonElement
  private readonly count: HTMLButtonElement
  private readonly picksList: PicksList
  private rows: PickRow[] = []
  private previewFor: number | null = null
  private hoverElement: Element | null = null
  private hoverLabel = ''

  private readonly panel: HTMLElement
  private readonly modeInputs = new Map<QuelloHtmlMode, HTMLInputElement>()
  private readonly limitRow: HTMLElement
  private readonly limitInput: HTMLInputElement
  private readonly copyToggle: HTMLInputElement
  private readonly scopeRow: HTMLElement
  private readonly scopeInputs = new Map<QuelloCopyScope, HTMLInputElement>()
  private readonly noteToggle: HTMLInputElement
  private toastTimer: number | null = null
  private spotlightTimer: number | null = null

  private readonly noteEditor: HTMLElement
  private readonly noteInput: HTMLTextAreaElement
  private noteFor: number | null = null

  private readonly nodes = new Map<number, BadgeNodes>()
  private readonly teardown: Array<() => void> = []
  private targets: BadgeTarget[] = []
  private frame: number | null = null
  private position: QuelloPoint | null = null
  private compact = false

  constructor(
    private readonly handlers: OverlayHandlers,
    { shortcutLabel = 'Alt+Q', theme }: OverlayOptions = {},
  ) {
    this.shortcutLabel = shortcutLabel
    this.host = document.createElement(HOST_TAG)
    this.host.setAttribute('data-quello', 'root')
    applyTheme(this.host, theme)
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

    this.toggleButton = button('primary', '', `Start picking (${this.shortcutLabel})`)
    this.toggleButton.setAttribute('aria-label', 'Toggle element picker')
    this.toggleButton.innerHTML = logoSvg(17)
    this.toggleButton.dataset.on = 'false'
    this.toggleButton.addEventListener('click', () => this.handlers.onToggle())

    this.clearButton = button('', 'Clear all', 'Remove every pick')
    this.clearButton.hidden = true
    this.clearButton.addEventListener('click', () => this.handlers.onClear())

    this.count = button('count', '', 'Show every pick')
    this.count.hidden = true
    this.count.dataset.on = 'false'
    this.count.addEventListener('click', () => this.togglePicksList())

    this.picksList = new PicksList({
      onScrollTo: (id) => this.handlers.onScrollToPick(id),
      onEditNote: (id) => this.openNote(id, this.pickById(id)?.note ?? ''),
      onCopy: (id) => this.handlers.onCopyPick(id),
      onRemove: (id) => this.handlers.onRemovePick(id),
      onPreview: (id) => this.preview(id),
    })

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
    const mark = el('span', 'mark')
    mark.innerHTML = markSvg(21)
    this.puck.append(mark)
    this.tally = el('span', 'tally')
    this.tally.hidden = true
    this.puck.append(this.tally)
    this.puck.hidden = true

    this.toast = el('div', 'toast')
    this.toast.hidden = true

    this.dock = el('div', 'dock')
    this.dock.append(this.toolbar, this.puck, this.toast)

    const panel = this.buildPanel()
    this.panel = panel.root
    this.limitRow = panel.limitRow
    this.limitInput = panel.limitInput
    this.copyToggle = panel.copyToggle
    this.scopeRow = panel.scopeRow
    this.noteToggle = panel.noteToggle

    const note = this.buildNoteEditor()
    this.noteEditor = note.root
    this.noteInput = note.input

    this.root.append(style, this.layer, this.panel, this.picksList.root, this.noteEditor, this.dock)

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
    this.dock.dataset.flip = String(this.dock.getBoundingClientRect().top < window.innerHeight / 3)
    if (this.panelOpen) this.positionPanel()
    if (this.picksList.open) this.anchorToDock(this.picksList.root)
  }

  /** Park a popover against the toolbar, flipping below it when there is no room above. */
  private anchorToDock(popover: HTMLElement): void {
    const dock = this.dock.getBoundingClientRect()
    const box = popover.getBoundingClientRect()

    const above = dock.top - box.height - PANEL_GAP
    const top = above >= EDGE_MARGIN ? above : dock.bottom + PANEL_GAP
    const left = Math.min(
      Math.max(EDGE_MARGIN, dock.right - box.width),
      Math.max(EDGE_MARGIN, window.innerWidth - box.width - EDGE_MARGIN),
    )
    popover.style.left = `${left}px`
    popover.style.top = `${top}px`
  }

  private positionPanel(): void {
    this.anchorToDock(this.panel)
  }

  get picksListOpen(): boolean {
    return this.picksList.open
  }

  togglePicksList(open = !this.picksList.open): void {
    this.picksList.toggle(open)
    this.count.dataset.on = String(open)
    if (open) {
      this.togglePanel(false)
      this.anchorToDock(this.picksList.root)
    }
  }

  private pickById(id: number): QuelloPick | undefined {
    return this.rows.find((row) => row.pick.id === id)?.pick
  }

  /** Outline the element a list row refers to, without entering picker mode. */
  private preview(id: number | null): void {
    this.previewFor = id
    if (id === null) {
      this.clearHover()
      return
    }
    const target = this.targets.find((candidate) => candidate.id === id)
    if (target) this.setHover(target.element, `PICK ${id}`)
    else this.clearHover()
  }

  private readonly onResize = (): void => {
    this.applyLayout()
  }

  // --- settings panel ----------------------------------------------------

  private buildPanel(): {
    root: HTMLElement
    limitRow: HTMLElement
    limitInput: HTMLInputElement
    copyToggle: HTMLInputElement
    scopeRow: HTMLElement
    noteToggle: HTMLInputElement
  } {
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

    const copyHeading = document.createElement('h2')
    copyHeading.textContent = 'Copy to clipboard'
    root.append(copyHeading)

    const copyField = document.createElement('label')
    copyField.className = 'field'
    const copyToggle = document.createElement('input')
    copyToggle.type = 'checkbox'
    copyToggle.addEventListener('change', () => {
      this.handlers.onSettingsChange({ copyOnPick: copyToggle.checked })
    })
    const copyText = document.createElement('span')
    copyText.textContent = 'Copy on pick'
    const copyNote = el('span', 'note')
    copyNote.textContent = 'Every time you select an element'
    copyText.append(copyNote)
    copyField.append(copyToggle, copyText)
    root.append(copyField)

    const scopeRow = el('div', 'scopes')
    const scopes: Array<{ scope: QuelloCopyScope; label: string }> = [
      { scope: 'last', label: 'Last pick' },
      { scope: 'all', label: 'Whole list' },
    ]
    for (const { scope, label } of scopes) {
      const field = document.createElement('label')
      field.className = 'field'
      const input = document.createElement('input')
      input.type = 'radio'
      input.name = 'quello-copy-scope'
      input.value = scope
      input.addEventListener('change', () => {
        if (input.checked) this.handlers.onSettingsChange({ copyScope: scope })
      })
      const text = document.createElement('span')
      text.textContent = label
      field.append(input, text)
      scopeRow.append(field)
      this.scopeInputs.set(scope, input)
    }
    root.append(scopeRow)

    const noteHeading = document.createElement('h2')
    noteHeading.textContent = 'Agent notes'
    root.append(noteHeading)

    const noteField = document.createElement('label')
    noteField.className = 'field'
    const noteToggle = document.createElement('input')
    noteToggle.type = 'checkbox'
    noteToggle.addEventListener('change', () => {
      this.handlers.onSettingsChange({ noteOnPick: noteToggle.checked })
    })
    const noteText = document.createElement('span')
    noteText.textContent = 'Ask on every pick'
    const noteNote = el('span', 'note')
    noteNote.textContent = 'Otherwise click a badge to write one'
    noteText.append(noteNote)
    noteField.append(noteToggle, noteText)
    root.append(noteField)

    return { root, limitRow, limitInput, copyToggle, scopeRow, noteToggle }
  }

  /** Briefly confirm an action next to the toolbar. */
  flash(message: string, failed = false): void {
    this.toast.textContent = message
    this.toast.dataset.failed = String(failed)
    this.toast.hidden = false
    if (this.toastTimer !== null) clearTimeout(this.toastTimer)
    this.toastTimer = window.setTimeout(() => {
      this.toast.hidden = true
      this.toastTimer = null
    }, 1400)
  }

  private buildNoteEditor(): { root: HTMLElement; input: HTMLTextAreaElement } {
    const root = el('div', 'note-editor')
    root.hidden = true

    const heading = document.createElement('h3')
    root.append(heading)

    const input = document.createElement('textarea')
    input.placeholder = 'What should the agent do with this element?'
    input.setAttribute('aria-label', 'Note for the agent')
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.closeNote()
      }
    })
    root.append(input)

    const row = el('div', 'row')
    const hint = el('span', 'hint')
    hint.textContent = 'Enter saves · Shift+Enter for a line break'
    const remove = button('danger', 'Remove pick', 'Remove this pick')
    remove.addEventListener('click', () => {
      const id = this.noteFor
      this.noteFor = null // drop the note: the pick is going away
      this.noteEditor.hidden = true
      if (id !== null) this.handlers.onRemovePick(id)
    })
    row.append(hint, remove)
    root.append(row)

    return { root, input }
  }

  get noteOpen(): boolean {
    return this.noteFor !== null
  }

  /** Open the note editor for a pick, anchored to its badge. */
  openNote(id: number, note: string): void {
    if (this.noteFor !== null && this.noteFor !== id) this.closeNote()
    this.noteFor = id
    const heading = this.noteEditor.querySelector('h3')
    if (heading) heading.textContent = `Note for PICK ${id}`
    this.noteInput.value = note
    this.noteEditor.hidden = false
    // Measure after the value is in, so an auto-grown textarea is already its final size.
    this.positionNote()
    this.noteInput.focus()
    this.noteInput.setSelectionRange(note.length, note.length)
  }

  /** Every way out of the editor keeps what was typed; an empty note clears it. */
  closeNote(): void {
    const id = this.noteFor
    if (id === null) return
    this.noteFor = null
    this.noteEditor.hidden = true
    this.handlers.onNoteChange(id, this.noteInput.value)
  }

  /**
   * Anchor the note editor to the pick's badge. A pick made on another page has no
   * badge on screen, so the editor sits beside the toolbar instead — on whichever
   * side has room for it.
   */
  private positionNote(): void {
    if (this.noteFor === null) return
    const editor = this.noteEditor.getBoundingClientRect()
    const size = { width: editor.width, height: editor.height }
    const node = this.nodes.get(this.noteFor)

    const point = node
      ? clampToViewport(
          { x: node.badge.getBoundingClientRect().left, y: node.badge.getBoundingClientRect().bottom + 8 },
          size,
        )
      : this.besideDock(size)

    this.noteEditor.style.left = `${point.x}px`
    this.noteEditor.style.top = `${point.y}px`
  }

  /** A spot next to the toolbar: left of it when that fits, otherwise right. */
  private besideDock(size: { width: number; height: number }): QuelloPoint {
    const dock = this.dock.getBoundingClientRect()
    const roomLeft = dock.left - EDGE_MARGIN
    const roomRight = window.innerWidth - dock.right - EDGE_MARGIN
    const onLeft = roomLeft >= size.width || roomLeft > roomRight
    const x = onLeft ? dock.left - size.width - PANEL_GAP : dock.right + PANEL_GAP
    // Bottom-aligned with the toolbar, which reads as belonging to it.
    return clampToViewport({ x, y: dock.bottom - size.height }, size)
  }

  get panelOpen(): boolean {
    return !this.panel.hidden
  }

  togglePanel(open = this.panel.hidden): void {
    this.panel.hidden = !open
    this.settingsButton.dataset.on = String(open)
    if (open) {
      this.togglePicksList(false)
      this.positionPanel()
    }
  }

  /** Render the toolbar and panel from the settings the picker actually holds. */
  setSettings(settings: QuelloSettings): void {
    for (const [mode, input] of this.modeInputs) input.checked = mode === settings.htmlMode
    this.limitInput.value = String(settings.htmlLimit)
    this.limitRow.dataset.disabled = String(settings.htmlMode !== 'truncated')

    this.copyToggle.checked = settings.copyOnPick
    for (const [scope, input] of this.scopeInputs) input.checked = scope === settings.copyScope
    this.scopeRow.dataset.disabled = String(!settings.copyOnPick)
    this.noteToggle.checked = settings.noteOnPick

    this.position = settings.toolbarPosition
    this.compact = settings.toolbarCompact
    this.applyLayout()
  }

  // --- picking feedback --------------------------------------------------

  setEnabled(enabled: boolean): void {
    this.toggleButton.dataset.on = String(enabled)
    this.toggleButton.title = enabled
      ? `Stop picking (${this.shortcutLabel})`
      : `Start picking (${this.shortcutLabel})`
    // The wordmark says what this is; while picking, the button says what it is doing.
    if (enabled) this.toggleButton.textContent = 'picking…'
    else this.toggleButton.innerHTML = logoSvg(17)
    this.puck.dataset.on = String(enabled)
    if (!enabled) this.clearHover()
  }

  setHover(element: Element, label: string): void {
    this.hoverElement = element
    this.hoverLabel = label
    this.placeHover()
    this.updateTracking()
  }

  private placeHover(): void {
    const element = this.hoverElement
    if (!element) return
    if (!element.isConnected) {
      this.clearHover()
      return
    }
    const rect = element.getBoundingClientRect()
    this.highlight.hidden = false
    place(this.highlight, rect.left, rect.top, rect.width, rect.height)

    this.tip.hidden = false
    this.tip.textContent = this.hoverLabel
    const above = rect.top > 22
    this.tip.style.left = `${Math.max(2, rect.left)}px`
    this.tip.style.top = `${above ? rect.top - 21 : rect.bottom + 3}px`
  }

  /** Outline an element briefly, to show where a scroll landed. */
  spotlight(element: Element, label: string): void {
    this.setHover(element, label)
    if (this.spotlightTimer !== null) clearTimeout(this.spotlightTimer)
    this.spotlightTimer = window.setTimeout(() => {
      this.clearHover()
      this.spotlightTimer = null
    }, 1600)
  }

  clearHover(): void {
    this.hoverElement = null
    this.highlight.hidden = true
    this.tip.hidden = true
    this.updateTracking()
  }

  /**
   * Re-render badges for the picks that are on screen. `total` counts every pick,
   * including those belonging to other pages, which is what the toolbar reports.
   */
  setPicks(targets: BadgeTarget[], all: QuelloPick[] = targets.map((t) => pickStub(t.id))): void {
    const total = all.length
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
      badge.title = `PICK ${target.id} — click to add a note`
      badge.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const current = this.targets.find((t) => t.id === target.id)
        this.openNote(target.id, current?.note ?? '')
      })
      const marker = el('div', 'marker')
      this.layer.append(marker, badge)
      this.nodes.set(target.id, { badge, marker })
    }

    for (const target of targets) {
      const node = this.nodes.get(target.id)
      if (node) node.badge.dataset.note = String(Boolean(target.note))
    }
    // A pick can vanish while its note is open — on a route change, say.
    if (this.noteFor !== null && !seen.has(this.noteFor)) this.closeNote()
    // Its row is gone too, so `mouseleave` will never come to clear the outline.
    if (this.previewFor !== null && !seen.has(this.previewFor)) this.preview(null)

    this.count.hidden = total === 0
    this.count.textContent = total === 1 ? '1 pick' : `${total} picks`
    if (total === 0) this.togglePicksList(false)

    const here = new Set(targets.map((target) => target.id))
    this.rows = all.map((pick) => ({ pick, here: here.has(pick.id) }))
    this.picksList.render(this.rows)
    if (this.picksList.open) this.anchorToDock(this.picksList.root)
    this.clearButton.hidden = total === 0
    this.tally.hidden = total === 0
    this.tally.textContent = String(total)

    this.reposition()
    this.updateTracking()
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
      // Deliberately unclamped: a badge pinned to the viewport edge would keep
      // pointing at an element that has already scrolled away.
      node.badge.style.left = `${rect.left - 8}px`
      node.badge.style.top = `${rect.top - 8}px`
    }
    this.placeHover()
    this.positionNote()
  }

  /** The frame loop is only worth running while something needs following. */
  private updateTracking(): void {
    if (this.targets.length > 0 || this.hoverElement) this.startTracking()
    else this.stopTracking()
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
    if (this.toastTimer !== null) clearTimeout(this.toastTimer)
    if (this.spotlightTimer !== null) clearTimeout(this.spotlightTimer)
    for (const off of this.teardown) off()
    this.host.remove()
  }
}

/** Minimal stand-in so `setPicks` stays callable with badges alone (tests, direct use). */
function pickStub(id: number): QuelloPick {
  return { id, label: `PICK ${id}` } as QuelloPick
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
