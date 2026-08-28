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
  selector: string
  domPath: string
  tag: string
  classes: string[]
  /** `textContent`, collapsed and truncated. */
  text: string
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
  /** Keyboard shortcut key (combined with Alt). Defaults to `q`. */
  shortcutKey?: string
  /** Maximum number of characters kept from an element's text. */
  textLimit?: number
  /** Start with picker mode already enabled. */
  autoEnable?: boolean
}

export interface QuelloInstance {
  enable(): void
  disable(): void
  toggle(): void
  readonly enabled: boolean
  getPicks(): QuelloPick[]
  clear(): void
  destroy(): void
}
