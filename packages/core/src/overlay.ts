import { iconSvg, logoSvg, markSvg } from './brand'
import { clampToViewport, draggable, EDGE_MARGIN } from './drag'
import { PicksList, PICKS_LIST_STYLES } from './picks-list'
import { SettingsPanel, SETTINGS_PANEL_STYLES } from './settings-panel'
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
${SETTINGS_PANEL_STYLES}

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
  /* Fixed box: the wordmark and "picking…" have different natural sizes, and the
     toolbar must not change shape when picker mode is toggled. */
  min-width: 83px;
  height: 31px;
  padding: 0 11px;
}
/* The wordmark's box includes the q's descender, so centring it geometrically
   leaves the letters sitting high; this nudges them back onto the optical centre. */
button.primary svg { margin-top: 4px; }
button.primary[data-on="true"] { background: #7c5cff; }
button.primary[data-on="true"]:hover { background: #6b4cf0; }
button.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 31px;
  height: 31px;
  padding: 0;
  line-height: 0;
}
/* Both icons are SVG so they centre on geometry rather than on font metrics,
   which is what left the glyph versions sitting high in the button. */
button.icon svg { display: block; }
button.icon[data-on="true"] { background: #37343f; }

/* Not a pill: a pill here would be a second button shape at a second height,
   sitting between two round ones. A label with a chevron reads as a disclosure. */
button.count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 31px;
  padding: 0 4px 0 6px;
  border-radius: 0;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  opacity: 0.65;
  white-space: nowrap;
}
button.count:hover, button.count[data-on="true"] { background: transparent; opacity: 1; }
/* Tabular figures keep 1 and 9 the same width; the min-width covers what they
   cannot — the second digit at 10, and the plural's "s". The label is left-aligned
   inside that box, so the chevron never moves either. */
.count-label {
  min-width: 52px;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  text-align: left;
}
/* An SVG rather than a glyph: a chevron character sits off-centre in its own box,
   so rotating it shifts it vertically. This one turns about its actual middle. */
.chev {
  display: flex;
  opacity: 0.55;
  transform-origin: 50% 50%;
  transition: opacity 120ms linear, transform 160ms ease;
}
button.count:hover .chev { opacity: 0.9; }
button.count[data-on="true"] .chev { opacity: 0.9; transform: rotate(180deg); }
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

`

/**
 * The `glass` skin, applied to every surface quello puts on screen so the chrome
 * stays one material. Only the surfaces change: the outlines drawn on the page
 * are the plugin's `theme`, and are left alone.
 */
const SKIN_STYLES = `
:host([data-skin="glass"]) .toolbar,
:host([data-skin="glass"]) .puck,
:host([data-skin="glass"]) .panel,
:host([data-skin="glass"]) .picks-list,
:host([data-skin="glass"]) .note-editor {
  background: rgba(28, 26, 36, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
/* The counter is excluded on purpose: it is a label with a chevron, not a button
   surface, and giving it one puts a short pill between two round ones. */
:host([data-skin="glass"]) .toolbar button:not(.count),
:host([data-skin="glass"]) .panel .tabs,
:host([data-skin="glass"]) .limit input,
:host([data-skin="glass"]) .note-editor textarea {
  background: rgba(255, 255, 255, 0.1);
}
:host([data-skin="glass"]) .toolbar button:not(.count):hover { background: rgba(255, 255, 255, 0.18); }
:host([data-skin="glass"]) .panel .tabs button[aria-selected="true"] {
  background: rgba(255, 255, 255, 0.18);
}
:host([data-skin="glass"]) .toolbar button.primary { background: transparent; }
:host([data-skin="glass"]) .toolbar button.primary[data-on="true"] { background: #7c5cff; }
:host([data-skin="glass"]) .picks-list .row:hover { background: rgba(255, 255, 255, 0.07); }
:host([data-skin="glass"]) .picks-list .row + .row { border-top-color: rgba(255, 255, 255, 0.08); }
:host([data-skin="glass"]) .puck[data-on="true"] {
  background: rgba(124, 92, 255, 0.78);
  border-color: rgba(255, 255, 255, 0.22);
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
  private readonly settingsButton: HTMLButtonElement
  private readonly count: HTMLButtonElement
  private readonly countLabel: HTMLElement
  private readonly picksList: PicksList
  private readonly panel: SettingsPanel
  private rows: PickRow[] = []
  private previewFor: number | null = null
  private hoverElement: Element | null = null
  private hoverLabel = ''

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
    style.textContent = STYLES + SKIN_STYLES

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

    this.count = button('count', '', 'Show every pick')
    this.count.hidden = true
    this.count.dataset.on = 'false'
    this.count.addEventListener('click', () => this.togglePicksList())
    this.countLabel = el('span', 'count-label')
    const chevron = el('span', 'chev')
    chevron.innerHTML = iconSvg('chevron', 13)
    this.count.append(this.countLabel, chevron)

    this.picksList = new PicksList({
      onScrollTo: (id) => this.handlers.onScrollToPick(id),
      onEditNote: (id) => this.openNote(id, this.pickById(id)?.note ?? ''),
      onCopy: (id) => this.handlers.onCopyPick(id),
      onRemove: (id) => this.handlers.onRemovePick(id),
      onClearAll: () => this.handlers.onClear(),
      onPreview: (id) => this.preview(id),
    })

    this.settingsButton = button('icon', '', 'Settings')
    this.settingsButton.innerHTML = iconSvg('gear', 18)
    this.settingsButton.setAttribute('aria-label', 'Settings')
    this.settingsButton.addEventListener('click', () => this.togglePanel())

    const collapseButton = button('icon', '', 'Collapse the toolbar')
    collapseButton.innerHTML = iconSvg('minus', 18)
    collapseButton.setAttribute('aria-label', 'Collapse the toolbar')
    collapseButton.addEventListener('click', () => this.setCompact(true))

    this.toolbar = el('div', 'toolbar')
    this.toolbar.append(grip, this.toggleButton, this.count, this.settingsButton, collapseButton)

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

    this.panel = new SettingsPanel({ onChange: (patch) => this.handlers.onSettingsChange(patch) })

    const note = this.buildNoteEditor()
    this.noteEditor = note.root
    this.noteInput = note.input

    this.root.append(
      style,
      this.layer,
      this.panel.root,
      this.picksList.root,
      this.noteEditor,
      this.dock,
    )

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
    this.anchorToDock(this.panel.root)
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
          {
            x: node.badge.getBoundingClientRect().left,
            y: node.badge.getBoundingClientRect().bottom + 8,
          },
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
    return !this.panel.root.hidden
  }

  togglePanel(open = this.panel.root.hidden): void {
    this.panel.root.hidden = !open
    this.settingsButton.dataset.on = String(open)
    if (open) {
      this.togglePicksList(false)
      this.positionPanel()
    }
  }

  /** Render the toolbar and panel from the settings the picker actually holds. */
  setSettings(settings: QuelloSettings): void {
    this.panel.setSettings(settings)
    this.host.dataset.skin = settings.toolbarSkin

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
    this.countLabel.textContent = total === 1 ? '1 pick' : `${total} picks`
    if (total === 0) this.togglePicksList(false)

    const here = new Set(targets.map((target) => target.id))
    this.rows = all.map((pick) => ({ pick, here: here.has(pick.id) }))
    this.picksList.render(this.rows)
    if (this.picksList.open) this.anchorToDock(this.picksList.root)
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
