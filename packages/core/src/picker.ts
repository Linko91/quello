import { detectFramework } from './framework'
import { Overlay } from './overlay'
import { collapseText, domPath, stableClasses, uniqueSelector } from './selector'
import { collectStyle } from './style'
import { PicksTransport } from './transport'
import type { QuelloInstance, QuelloOptions, QuelloPick, QuelloRect } from './types'

const DEFAULT_ENDPOINT = '/__quello/picks'
const DEFAULT_TEXT_LIMIT = 120

interface Entry {
  pick: QuelloPick
  element: Element
}

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
  private nextId = 1
  private hovered: Element | null = null

  constructor(options: QuelloOptions = {}) {
    this.textLimit = options.textLimit ?? DEFAULT_TEXT_LIMIT
    this.shortcutKey = (options.shortcutKey ?? 'q').toLowerCase()
    this.transport = new PicksTransport(
      options.endpoint === undefined ? DEFAULT_ENDPOINT : options.endpoint,
    )
    this.overlay = new Overlay({
      onToggle: () => this.toggle(),
      onClear: () => this.clear(),
      onRemovePick: (id) => this.remove(id),
    })

    this.overlay.mount()
    window.addEventListener('keydown', this.onKeyDown, true)
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

  clear(): void {
    this.entries.length = 0
    this.nextId = 1
    this.sync()
  }

  destroy(): void {
    this.disable()
    window.removeEventListener('keydown', this.onKeyDown, true)
    this.overlay.destroy()
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
    this.entries.push({ element, pick: this.describe(element, this.nextId++) })
    this.sync()
  }

  private describe(element: Element, id: number): QuelloPick {
    return {
      id,
      label: `PICK ${id}`,
      selector: uniqueSelector(element),
      domPath: domPath(element),
      tag: element.tagName.toLowerCase(),
      classes: stableClasses(element),
      text: collapseText(element.textContent, this.textLimit),
      rect: toRect(element.getBoundingClientRect()),
      style: collectStyle(element),
      framework: detectFramework(element),
      page: { url: location.href, title: document.title },
      pickedAt: new Date().toISOString(),
    }
  }

  /** Push state to the overlay and persist it. */
  private sync(): void {
    this.overlay.setPicks(this.entries.map((e) => ({ id: e.pick.id, element: e.element })))
    void this.transport.save(this.getPicks())
  }

  /** Re-attach badges for picks made on this page before a reload. */
  private async restore(): Promise<void> {
    const stored = await this.transport.load()
    for (const pick of stored) {
      if (pick.page?.url !== location.href) continue
      const element = document.querySelector(pick.selector)
      if (!element || this.overlay.host.contains(element)) continue
      // `rect` and `style` describe the element as it is now, not as it was
      // before the reload, so they are re-read rather than trusted from disk.
      this.entries.push({
        element,
        pick: {
          ...pick,
          rect: toRect(element.getBoundingClientRect()),
          style: collectStyle(element),
        },
      })
      this.nextId = Math.max(this.nextId, pick.id + 1)
    }
    if (this.entries.length > 0) this.sync()
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
    if (event.key === 'Escape' && this.isEnabled) this.disable()
  }
}
