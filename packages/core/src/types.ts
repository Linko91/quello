/** Serializable subset of DOMRect, rounded to whole pixels. */
export interface QuelloRect {
  x: number
  y: number
  width: number
  height: number
  top: number
  left: number
  right: number
  bottom: number
}

/** Component-level information recovered from a framework's internals. */
export interface FrameworkInfo {
  framework: 'vue' | 'react'
  /** Component display name, when the framework exposes one. */
  component?: string
  /** Source file the component (or element) was declared in. */
  file?: string
  line?: number
  column?: number
}

/** Computed presentation of a picked element, as `getComputedStyle` reports it. */
export interface QuelloStyle {
  display: string
  /** `font-size/line-height`, e.g. `14px/20px`. */
  font: string
  fontWeight: string
  color: string
  /** `background-color`. */
  background: string
  padding: string
  margin: string
  gap: string
  borderRadius: string
}

import type { QuelloTheme } from './theme'

/** How much of an element's markup a pick should carry. */
export type QuelloHtmlMode =
  /** No `html` field at all. */
  | 'none'
  /** The middle of `outerHTML` is elided to fit `htmlLimit` characters. */
  | 'truncated'
  /** The complete `outerHTML`, however long. */
  | 'full'

/** How much of the pick list a copy carries. */
export type QuelloCopyScope =
  /** Only the element just picked. */
  | 'last'
  /** Every pick made so far, as an array. */
  | 'all'

/** Where the toolbar sits, as px from the viewport's top-left. */
export interface QuelloPoint {
  x: number
  y: number
}

/** Per-developer preferences, kept in localStorage rather than in the project. */
export interface QuelloSettings {
  htmlMode: QuelloHtmlMode
  /** Maximum length of `html` when `htmlMode` is `truncated`. */
  htmlLimit: number
  /** Dragged position of the toolbar. `null` parks it in the bottom-right corner. */
  toolbarPosition: QuelloPoint | null
  /** Toolbar collapsed to the compact puck. */
  toolbarCompact: boolean
  /** Write to the clipboard every time an element is picked. Off by default. */
  copyOnPick: boolean
  /** What `copyOnPick` copies. */
  copyScope: QuelloCopyScope
  /** Open the note editor as soon as an element is picked. */
  noteOnPick: boolean
}

/** The page a pick was made on. */
export interface QuelloPage {
  url: string
  /** `document.title` at the moment of the pick. */
  title: string
}

/** A single element the user picked, as handed to the coding agent. */
export interface QuelloPick {
  /** Progressive, 1-based. Rendered to the user as `PICK <id>`. */
  id: number
  label: string
  /**
   * Free-text instruction the developer attached to this pick, for the agent to
   * act on. Absent when no note was written.
   */
  note?: string
  selector: string
  domPath: string
  tag: string
  classes: string[]
  /** Every attribute as written in the markup, values truncated. */
  attributes: Record<string, string>
  /** `textContent`, collapsed and truncated. */
  text: string
  /** `outerHTML`, subject to the `htmlMode` setting. Absent when that setting is `none`. */
  html?: string
  rect: QuelloRect
  style: QuelloStyle
  framework: FrameworkInfo | null
  page: QuelloPage
  /** ISO-8601. */
  pickedAt: string
}

/** Payload persisted to `.quello/picks.json` and exchanged with the dev server. */
export interface QuelloPicksFile {
  version: 1
  updatedAt: string
  picks: QuelloPick[]
}

export interface QuelloOptions {
  /** Dev-server endpoint that persists picks. Set to `null` to disable persistence. */
  endpoint?: string | null
  /**
   * Keyboard shortcut that toggles picker mode, declared in full: `alt+q`,
   * `ctrl+shift+p`, `f2`. Defaults to `alt+q`.
   */
  shortcut?: string
  /** Maximum number of characters kept from an element's text. */
  textLimit?: number
  /** Start with picker mode already enabled. */
  autoEnable?: boolean
  /** Initial value for the `htmlMode` setting, used until the user changes it in the panel. */
  htmlMode?: QuelloHtmlMode
  /** Initial value for the `htmlLimit` setting. */
  htmlLimit?: number
  /** Look of the hover and picked outlines. Code-level only; not exposed in the toolbar. */
  theme?: QuelloTheme
}

export interface QuelloInstance {
  enable(): void
  disable(): void
  toggle(): void
  readonly enabled: boolean
  getPicks(): QuelloPick[]
  /** Attach (or, with an empty string, clear) the agent note on a pick. */
  setNote(id: number, note: string): void
  getSettings(): QuelloSettings
  /** Merge a partial change; picks already made are re-described with the new settings. */
  setSettings(patch: Partial<QuelloSettings>): void
  clear(): void
  destroy(): void
}
