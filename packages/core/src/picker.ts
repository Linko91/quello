import { collectAttributes } from './attributes'
import { copyText, describeCopy, formatPicks } from './clipboard'
import { detectFramework } from './framework'
import { Overlay } from './overlay'
import { collapseText, domPath, stableClasses, uniqueSelector } from './selector'
import { collectHtml, DEFAULT_SETTINGS, loadSettings, normalizeSettings, saveSettings } from './settings'
import { collectStyle } from './style'
import { PicksTransport } from './transport'
import type {
  QuelloInstance,
  QuelloOptions,
  QuelloPick,
  QuelloRect,
  QuelloSettings,
} from './types'

const DEFAULT_ENDPOINT = '/__quello/picks'
const DEFAULT_TEXT_LIMIT = 120

interface Entry {
  pick: QuelloPick
  /** `null` while the pick's page is not the one on screen, or its element is gone. */
  element: Element | null
}

/**
 * Identity of a page for the purpose of matching picks: origin, path and query,
 * but not the hash — jumping to `#section` is not landing on another page.
 */
export function pageKey(href: string): string {
  try {
    const url = new URL(href, location.href)
    return `${url.origin}${url.pathname}${url.search}`
  } catch {
    return href
  }
}

/**
 * Attach or clear a pick's note without disturbing the order of its other keys:
 * `note` sits right after `label`, near the top where it is easy to read.
 */
export function withNote(pick: QuelloPick, note: string): QuelloPick {
  const trimmed = note.trim()
  const { note: _previous, id, label, ...rest } = pick
  return trimmed ? { id, label, note: trimmed, ...rest } : { id, label, ...rest }
}

/** How long to keep retrying after a URL change, since routers render after they navigate. */
const REATTACH_DELAYS = [0, 60, 180, 400]
const URL_POLL_MS = 250

function toRect(rect: DOMRect): QuelloRect {
  const round = Math.round
  return {
    x: round(rect.x),
    y: round(rect.y),
    width: round(rect.width),
    height: round(rect.height),
    top: round(rect.top),
    left: round(rect.left),
    right: round(rect.right),
    bottom: round(rect.bottom),
  }
}

export class QuelloPicker implements QuelloInstance {
  private readonly overlay: Overlay
  private readonly transport: PicksTransport
  private readonly textLimit: number
  private readonly shortcutKey: string
  private readonly entries: Entry[] = []
  private isEnabled = false
  private currentSettings: QuelloSettings
  private nextId = 1
  private hovered: Element | null = null
  private currentUrl = location.href
  private urlTimer: number | null = null

  constructor(options: QuelloOptions = {}) {
    this.textLimit = options.textLimit ?? DEFAULT_TEXT_LIMIT
    this.shortcutKey = (options.shortcutKey ?? 'q').toLowerCase()
    this.transport = new PicksTransport(
      options.endpoint === undefined ? DEFAULT_ENDPOINT : options.endpoint,
    )
    this.currentSettings = loadSettings(
      normalizeSettings(
        { htmlMode: options.htmlMode, htmlLimit: options.htmlLimit },
        DEFAULT_SETTINGS,
      ),
    )
    this.overlay = new Overlay({
      onToggle: () => this.toggle(),
      onClear: () => this.clear(),
      onRemovePick: (id) => this.remove(id),
      onNoteChange: (id, note) => this.setNote(id, note),
      onSettingsChange: (patch) => this.setSettings(patch),
    })

    this.overlay.mount()
    this.overlay.setSettings(this.currentSettings)
    window.addEventListener('keydown', this.onKeyDown, true)
    window.addEventListener('popstate', this.onLocationMaybeChanged)
    window.addEventListener('hashchange', this.onLocationMaybeChanged)
    // A client-side router changes the URL without an event anyone can listen to,
    // so the URL itself is what gets watched.
    this.urlTimer = window.setInterval(this.onLocationMaybeChanged, URL_POLL_MS)
    void this.restore()
    if (options.autoEnable) this.enable()
  }

  get enabled(): boolean {
    return this.isEnabled
  }

  enable(): void {
    if (this.isEnabled) return
    this.isEnabled = true
    document.addEventListener('mousemove', this.onMouseMove, true)
    document.addEventListener('click', this.onClick, true)
    this.overlay.setEnabled(true)
  }

  disable(): void {
    if (!this.isEnabled) return
    this.isEnabled = false
    this.hovered = null
    document.removeEventListener('mousemove', this.onMouseMove, true)
    document.removeEventListener('click', this.onClick, true)
    this.overlay.setEnabled(false)
  }

  toggle(): void {
    if (this.isEnabled) this.disable()
    else this.enable()
  }

  getPicks(): QuelloPick[] {
    return this.entries.map((entry) => entry.pick)
  }

  setNote(id: number, note: string): void {
    const entry = this.entries.find((candidate) => candidate.pick.id === id)
    if (!entry) return
    const next = withNote(entry.pick, note)
    if (next.note === entry.pick.note) return
    entry.pick = next
    this.sync()
  }

  getSettings(): QuelloSettings {
    return { ...this.currentSettings }
  }

  /** Re-describes existing picks, so a change in the panel is reflected immediately. */
  setSettings(patch: Partial<QuelloSettings>): void {
    const previous = this.currentSettings
    this.currentSettings = normalizeSettings({ ...previous, ...patch })
    saveSettings(this.currentSettings)
    this.overlay.setSettings(this.currentSettings)

    // Moving or collapsing the toolbar changes no pick, and re-writing picks.json
    // on every frame of a drag would be nothing but noise.
    const affectsPicks =
      previous.htmlMode !== this.currentSettings.htmlMode ||
      previous.htmlLimit !== this.currentSettings.htmlLimit
    if (!affectsPicks) return

    // A pick whose page is not on screen has no element to re-read; it keeps
    // whatever it was last described with until its page comes back.
    for (const entry of this.entries) {
      if (entry.element) entry.pick = this.redescribe(entry.element, entry.pick)
    }
    this.sync()
  }

  clear(): void {
    this.entries.length = 0
    this.nextId = 1
    this.sync()
  }

  destroy(): void {
    this.disable()
    window.removeEventListener('keydown', this.onKeyDown, true)
    window.removeEventListener('popstate', this.onLocationMaybeChanged)
    window.removeEventListener('hashchange', this.onLocationMaybeChanged)
    if (this.urlTimer !== null) clearInterval(this.urlTimer)
    this.overlay.destroy()
  }

  private readonly onLocationMaybeChanged = (): void => {
    if (location.href === this.currentUrl) return
    this.currentUrl = location.href
    for (const delay of REATTACH_DELAYS) window.setTimeout(() => this.reattach(), delay)
  }

  /**
   * Match every pick against the page on screen: those that belong to it are
   * resolved against the live DOM, the rest are detached but kept in the list.
   */
  private reattach(): void {
    const here = pageKey(location.href)
    let changed = false

    for (const entry of this.entries) {
      if (pageKey(entry.pick.page.url) !== here) {
        if (entry.element) {
          entry.element = null
          changed = true
        }
        continue
      }
      if (entry.element?.isConnected) continue

      const found = this.resolve(entry.pick.selector)
      if (found) {
        entry.element = found
        entry.pick = this.redescribe(found, entry.pick)
        changed = true
      } else if (entry.element) {
        entry.element = null
        changed = true
      }
    }
    if (changed) this.sync()
  }

  /** Look up a selector, refusing to ever return quello's own UI. */
  private resolve(selector: string): Element | null {
    let found: Element | null = null
    try {
      found = document.querySelector(selector)
    } catch {
      return null
    }
    return found && !this.overlay.host.contains(found) ? found : null
  }

  private remove(id: number): void {
    const index = this.entries.findIndex((entry) => entry.pick.id === id)
    if (index === -1) return
    this.entries.splice(index, 1)
    if (this.entries.length === 0) this.nextId = 1
    this.sync()
  }

  private add(element: Element): void {
    const existing = this.entries.find((entry) => entry.element === element)
    if (existing) {
      this.remove(existing.pick.id)
      return
    }
    const pick = this.describe(element, this.nextId++)
    this.entries.push({ element, pick })
    this.sync()
    void this.copyOnPick()
    if (this.currentSettings.noteOnPick) this.overlay.openNote(pick.id, '')
  }

  private describe(element: Element, id: number): QuelloPick {
    const html = collectHtml(element, this.currentSettings)
    return {
      id,
      label: `PICK ${id}`,
      selector: uniqueSelector(element),
      domPath: domPath(element),
      tag: element.tagName.toLowerCase(),
      classes: stableClasses(element),
      attributes: collectAttributes(element),
      text: collapseText(element.textContent, this.textLimit),
      ...(html === undefined ? {} : { html }),
      rect: toRect(element.getBoundingClientRect()),
      style: collectStyle(element),
      framework: detectFramework(element),
      page: { url: location.href, title: document.title },
      pickedAt: new Date().toISOString(),
    }
  }

  /** Re-read an existing pick from its element, keeping only its identity. */
  private redescribe(element: Element, pick: QuelloPick): QuelloPick {
    const described = { ...this.describe(element, pick.id), pickedAt: pick.pickedAt }
    // The note is the developer's, not the element's: re-reading must not drop it.
    return withNote(described, pick.note ?? '')
  }

  /** Mirror the pick to the clipboard, when the developer asked for that. */
  private async copyOnPick(): Promise<void> {
    const { copyOnPick, copyScope } = this.currentSettings
    if (!copyOnPick) return
    const picks = this.getPicks()
    const text = formatPicks(picks, copyScope)
    if (!text) return
    const copied = await copyText(text)
    this.overlay.flash(copied ? describeCopy(picks, copyScope) : 'Copy failed', !copied)
  }

  /** Push state to the overlay and persist it. */
  private sync(): void {
    const targets = this.entries
      .filter((entry): entry is Entry & { element: Element } => entry.element !== null)
      .map((entry) => ({ id: entry.pick.id, element: entry.element, note: entry.pick.note }))
    // Badges only for what is on screen; the count covers every page.
    this.overlay.setPicks(targets, this.entries.length)
    void this.transport.save(this.getPicks())
  }

  /** Re-attach badges for picks made on this page before a reload. */
  private async restore(): Promise<void> {
    const stored = await this.transport.load()
    if (stored.length === 0) return
    const here = pageKey(location.href)

    for (const pick of stored) {
      if (!pick.page?.url) continue
      // Picks made on other pages are kept, just without an element to point at.
      const element = pageKey(pick.page.url) === here ? this.resolve(pick.selector) : null
      // Everything but the identity of a resolved pick is re-read: `rect`, `style`
      // and `html` describe the element as it is now, not as it was before.
      this.entries.push({ element, pick: element ? this.redescribe(element, pick) : pick })
      this.nextId = Math.max(this.nextId, pick.id + 1)
    }
    this.sync()
  }

  private isOwnUi(event: Event): boolean {
    return event.composedPath().includes(this.overlay.host)
  }

  private targetOf(event: Event): Element | null {
    if (this.isOwnUi(event)) return null
    const [first] = event.composedPath()
    const candidate = first instanceof Element ? first : event.target
    return candidate instanceof Element ? candidate : null
  }

  private readonly onMouseMove = (event: MouseEvent): void => {
    const element = this.targetOf(event)
    if (!element) {
      this.hovered = null
      this.overlay.clearHover()
      return
    }
    if (element === this.hovered) return
    this.hovered = element
    const info = detectFramework(element)
    const label = info?.component
      ? `<${element.tagName.toLowerCase()}> · ${info.component}`
      : `<${element.tagName.toLowerCase()}>`
    this.overlay.setHover(element, label)
  }

  private readonly onClick = (event: MouseEvent): void => {
    const element = this.targetOf(event)
    if (!element) return
    event.preventDefault()
    event.stopPropagation()
    this.add(element)
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey && event.key.toLowerCase() === this.shortcutKey) {
      event.preventDefault()
      this.toggle()
      return
    }
    if (event.key !== 'Escape') return
    if (this.overlay.noteOpen) this.overlay.closeNote()
    else if (this.overlay.panelOpen) this.overlay.togglePanel(false)
    else if (this.isEnabled) this.disable()
  }
}
