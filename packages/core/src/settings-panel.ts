import { MAX_HTML_LIMIT, MIN_HTML_LIMIT } from './settings'
import type { QuelloCopyScope, QuelloHtmlMode, QuelloSettings, QuelloSkin } from './types'

export const SETTINGS_PANEL_STYLES = `
.panel {
  position: fixed;
  z-index: 2147483647;
  width: 244px;
  padding: 10px;
  border: 1px solid #2a2d33;
  border-radius: 10px;
  background: #17191c;
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}
.panel[hidden] { display: none; }

.tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 10px;
  padding: 2px;
  border-radius: 8px;
  background: #0e1013;
}
.tabs button {
  flex: 1;
  padding: 5px 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9b9fa8;
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}
.tabs button:hover { color: #fff; }
.tabs button[aria-selected="true"] { background: #2a2d33; color: #fff; }

/* Every tab occupies the same grid cell, so the panel is always as tall as the
   tallest one and switching tabs never resizes it. */
.tabpanels { display: grid; }
.tabpanel {
  grid-area: 1 / 1;
  visibility: hidden;
  align-self: start;
}
.tabpanel[data-active="true"] { visibility: visible; }
.tabpanel .lede {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.45;
  opacity: 0.5;
}

.field { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 12px; cursor: pointer; }
.field input { accent-color: #ffb020; margin: 0; cursor: pointer; }
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
  border: 1px solid #373b41;
  border-radius: 6px;
  background: #0e1013;
  color: #fff;
  font: inherit;
}

.scopes { margin-left: 22px; }
.scopes .field { padding: 3px 0; }
.scopes[data-disabled="true"] { opacity: 0.3; pointer-events: none; }
`

export interface SettingsPanelHandlers {
  onChange(patch: Partial<QuelloSettings>): void
}

type TabKey = 'html' | 'clipboard' | 'notes' | 'theme'

const TABS: Array<{ key: TabKey; label: string; lede: string }> = [
  { key: 'html', label: 'HTML', lede: 'How much of the element’s markup each pick carries.' },
  { key: 'clipboard', label: 'Clipboard', lede: 'Mirror picks to the clipboard as you make them.' },
  { key: 'notes', label: 'Notes', lede: 'Instructions the agent reads when it resolves the picks.' },
  { key: 'theme', label: 'Theme', lede: 'How quello’s own toolbar and panels look.' },
]

/**
 * The settings panel, one tab per group. Everything here is a working preference —
 * the sort of thing you change mid-session. Anything that belongs to a project
 * rather than to a person is a plugin option instead.
 */
export class SettingsPanel {
  readonly root: HTMLElement
  private readonly tabButtons = new Map<TabKey, HTMLButtonElement>()
  private readonly tabPanels = new Map<TabKey, HTMLElement>()
  private readonly modeInputs = new Map<QuelloHtmlMode, HTMLInputElement>()
  private readonly scopeInputs = new Map<QuelloCopyScope, HTMLInputElement>()
  private readonly skinInputs = new Map<QuelloSkin, HTMLInputElement>()
  private readonly limitRow: HTMLElement
  private readonly limitInput: HTMLInputElement
  private readonly copyToggle: HTMLInputElement
  private readonly scopeRow: HTMLElement
  private readonly noteToggle: HTMLInputElement
  private active: TabKey = 'html'

  constructor(private readonly handlers: SettingsPanelHandlers) {
    this.root = element('div', 'panel')
    this.root.hidden = true

    const tabs = element('div', 'tabs')
    tabs.setAttribute('role', 'tablist')
    for (const tab of TABS) {
      const button = document.createElement('button')
      button.textContent = tab.label
      button.setAttribute('role', 'tab')
      button.addEventListener('click', () => this.select(tab.key))
      tabs.append(button)
      this.tabButtons.set(tab.key, button)

      const panel = element('div', 'tabpanel')
      panel.setAttribute('role', 'tabpanel')
      // A short description of what the tab is for, rather than a heading that
      // only repeats the tab's own label.
      const lede = element('p', 'lede')
      lede.textContent = tab.lede
      panel.append(lede)
      this.tabPanels.set(tab.key, panel)
    }

    const panels = element('div', 'tabpanels')
    panels.append(...this.tabPanels.values())
    this.root.append(tabs, panels)

    const html = this.tabPanels.get('html')!
    for (const option of [
      { mode: 'none' as const, label: 'None', note: 'No html field' },
      { mode: 'truncated' as const, label: 'Truncated', note: 'Middle elided to fit' },
      { mode: 'full' as const, label: 'Full', note: 'Complete outerHTML' },
    ]) {
      const input = radio('quello-html-mode', option.mode, () =>
        this.handlers.onChange({ htmlMode: option.mode }),
      )
      html.append(field(input, option.label, option.note))
      this.modeInputs.set(option.mode, input)
    }

    this.limitRow = element('div', 'limit')
    const limitLabel = document.createElement('label')
    limitLabel.textContent = 'max'
    this.limitInput = document.createElement('input')
    this.limitInput.type = 'number'
    this.limitInput.min = String(MIN_HTML_LIMIT)
    this.limitInput.max = String(MAX_HTML_LIMIT)
    this.limitInput.step = '50'
    this.limitInput.setAttribute('aria-label', 'Maximum HTML characters')
    this.limitInput.addEventListener('change', () => {
      this.handlers.onChange({ htmlLimit: Number(this.limitInput.value) })
    })
    const unit = document.createElement('span')
    unit.textContent = 'chars'
    limitLabel.append(this.limitInput)
    this.limitRow.append(limitLabel, unit)
    html.append(this.limitRow)

    const clipboard = this.tabPanels.get('clipboard')!
    this.copyToggle = document.createElement('input')
    this.copyToggle.type = 'checkbox'
    this.copyToggle.addEventListener('change', () => {
      this.handlers.onChange({ copyOnPick: this.copyToggle.checked })
    })
    clipboard.append(field(this.copyToggle, 'Copy on pick', 'Every time you select an element'))

    this.scopeRow = element('div', 'scopes')
    for (const option of [
      { scope: 'last' as const, label: 'Last pick' },
      { scope: 'all' as const, label: 'Whole list' },
    ]) {
      const input = radio('quello-copy-scope', option.scope, () =>
        this.handlers.onChange({ copyScope: option.scope }),
      )
      this.scopeRow.append(field(input, option.label))
      this.scopeInputs.set(option.scope, input)
    }
    clipboard.append(this.scopeRow)

    const notes = this.tabPanels.get('notes')!
    this.noteToggle = document.createElement('input')
    this.noteToggle.type = 'checkbox'
    this.noteToggle.addEventListener('change', () => {
      this.handlers.onChange({ noteOnPick: this.noteToggle.checked })
    })
    notes.append(field(this.noteToggle, 'Ask on every pick', 'Otherwise click a badge to write one'))

    const theme = this.tabPanels.get('theme')!
    for (const option of [
      { skin: 'fill' as const, label: 'Fill', note: 'Solid dark surfaces' },
      { skin: 'glass' as const, label: 'Glass', note: 'Frosted, shows the page through' },
    ]) {
      const input = radio('quello-skin', option.skin, () =>
        this.handlers.onChange({ toolbarSkin: option.skin }),
      )
      theme.append(field(input, option.label, option.note))
      this.skinInputs.set(option.skin, input)
    }

    this.select('html')
  }

  private select(key: TabKey): void {
    this.active = key
    for (const [tab, button] of this.tabButtons) {
      button.setAttribute('aria-selected', String(tab === key))
    }
    for (const [tab, panel] of this.tabPanels) panel.dataset.active = String(tab === key)
  }

  /** Render every control from the settings the picker actually holds. */
  setSettings(settings: QuelloSettings): void {
    for (const [mode, input] of this.modeInputs) input.checked = mode === settings.htmlMode
    this.limitInput.value = String(settings.htmlLimit)
    this.limitRow.dataset.disabled = String(settings.htmlMode !== 'truncated')

    this.copyToggle.checked = settings.copyOnPick
    for (const [scope, input] of this.scopeInputs) input.checked = scope === settings.copyScope
    this.scopeRow.dataset.disabled = String(!settings.copyOnPick)

    this.noteToggle.checked = settings.noteOnPick
    for (const [skin, input] of this.skinInputs) input.checked = skin === settings.toolbarSkin
  }
}

function element(tag: string, className: string): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  return node
}

function radio(name: string, value: string, onPick: () => void): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'radio'
  input.name = name
  input.value = value
  input.addEventListener('change', () => {
    if (input.checked) onPick()
  })
  return input
}

function field(input: HTMLInputElement, label: string, note?: string): HTMLElement {
  const wrapper = document.createElement('label')
  wrapper.className = 'field'
  const text = document.createElement('span')
  text.textContent = label
  if (note) {
    const hint = element('span', 'note')
    hint.textContent = note
    text.append(hint)
  }
  wrapper.append(input, text)
  return wrapper
}
