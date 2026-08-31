import { collapseText } from './selector'
import type { QuelloPick } from './types'

export const PICKS_LIST_STYLES = `
.picks-list {
  position: fixed;
  z-index: 2147483647;
  width: 320px;
  max-height: min(60vh, 460px);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3a3e46 transparent;
  padding: 6px;
  border: 1px solid #2a2d33;
  border-radius: 10px;
  background: #17191c;
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}
.picks-list[hidden] { display: none; }

/* WebKit ignores scrollbar-color, so the thumb is drawn by hand there too. */
.picks-list::-webkit-scrollbar { width: 9px; }
.picks-list::-webkit-scrollbar-track { background: transparent; }
.picks-list::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background: #3a3e46;
  background-clip: padding-box;
}
.picks-list::-webkit-scrollbar-thumb:hover {
  background: #525764;
  background-clip: padding-box;
}
.picks-list .empty { padding: 14px 10px; font-size: 12px; opacity: 0.5; text-align: center; }

.picks-list .foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  padding-top: 7px;
  border-top: 1px solid #22262c;
}
.picks-list .foot button {
  padding: 5px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #ef4444;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.picks-list .foot button:hover { background: #3a1f24; }

.row {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
}
.row + .row { border-top: 1px solid #22262c; }
/* Without this the ellipsis never kicks in and the row widens the whole list. */
.row > div { min-width: 0; }
.row:hover { background: #1e2126; }
.row[data-elsewhere="true"] .where { color: #5ec2f2; }

/* Quiet by default: the number identifies the row, it does not need to shout. */
.row .n {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid rgba(255, 176, 32, 0.45);
  background: rgba(255, 176, 32, 0.16);
  color: #ffc266;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.row:hover .n { border-color: rgba(255, 176, 32, 0.8); color: #ffd699; }
.row[data-note="true"] .n {
  border-color: rgba(94, 194, 242, 0.75);
  background: rgba(94, 194, 242, 0.14);
  color: #5ec2f2;
}

.row .title { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.row .who { font-size: 12px; font-weight: 600; line-height: 1.3; white-space: nowrap; }
.row .where {
  flex: 1;
  min-width: 0;
  font-size: 10px;
  color: #6f747e;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row .what {
  margin-top: 2px;
  font-size: 11px;
  color: #9b9fa8;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row .memo {
  margin-top: 5px;
  padding: 4px 7px;
  border-left: 2px solid #5ec2f2;
  border-radius: 0 5px 5px 0;
  background: #20242a;
  font-size: 11px;
  line-height: 1.4;
  color: #e6e9ee;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.row .acts { display: flex; gap: 2px; margin-top: 7px; }
.row .acts button {
  padding: 5px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9b9fa8;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.row .acts button:hover { background: #2f333a; color: #fff; }
.row .acts button.danger:hover { background: #3a1f24; color: #ef4444; }
.row .acts button.noted { color: #5ec2f2; }
.row .acts button.noted:hover { background: #192730; color: #5ec2f2; }
`

export interface PicksListHandlers {
  onScrollTo(id: number): void
  onClearAll(): void
  onEditNote(id: number): void
  onCopy(id: number): void
  onRemove(id: number): void
  /** Highlight the element a row refers to, or clear it with `null`. */
  onPreview(id: number | null): void
}

/** What a row needs beyond the pick itself. */
export interface PickRow {
  pick: QuelloPick
  /** Whether the pick's element is on the page currently shown. */
  here: boolean
}

/**
 * The dropdown behind the toolbar's pick counter: every pick across every page,
 * with the actions that apply to one.
 */
export class PicksList {
  readonly root: HTMLElement

  constructor(private readonly handlers: PicksListHandlers) {
    this.root = document.createElement('div')
    this.root.className = 'picks-list'
    this.root.hidden = true
  }

  get open(): boolean {
    return !this.root.hidden
  }

  toggle(open = this.root.hidden): void {
    this.root.hidden = !open
    if (!open) this.handlers.onPreview(null)
  }

  render(rows: PickRow[]): void {
    this.root.replaceChildren()
    if (rows.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty'
      empty.textContent = 'No picks yet'
      this.root.append(empty)
      return
    }
    for (const row of rows) this.root.append(this.buildRow(row))

    // "Clear all" lives with the list it empties, rather than in the toolbar.
    const foot = document.createElement('div')
    foot.className = 'foot'
    const clear = document.createElement('button')
    clear.textContent = `Clear all ${rows.length}`
    clear.title = 'Remove every pick, on every page'
    clear.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.handlers.onClearAll()
    })
    foot.append(clear)
    this.root.append(foot)
  }

  private buildRow({ pick, here }: PickRow): HTMLElement {
    const row = document.createElement('div')
    row.className = 'row'
    row.dataset.note = String(Boolean(pick.note))
    row.dataset.elsewhere = String(!here)

    const n = document.createElement('span')
    n.className = 'n'
    n.textContent = String(pick.id)

    const body = document.createElement('div')

    const title = document.createElement('div')
    title.className = 'title'
    const who = document.createElement('span')
    who.className = 'who'
    who.textContent = pick.framework?.component ?? `<${pick.tag}>`
    // The page sits beside the component name: together they say which one this is.
    const where = document.createElement('span')
    where.className = 'where'
    where.textContent = pathOf(pick.page.url)
    where.title = pick.page.url
    title.append(who, where)

    const what = document.createElement('div')
    what.className = 'what'
    // The component name alone rarely identifies which instance was picked.
    what.textContent = pick.text ? `${pick.selector} · ${collapseText(pick.text, 40)}` : pick.selector
    what.title = pick.selector

    body.append(title, what)

    if (pick.note) {
      const memo = document.createElement('div')
      memo.className = 'memo'
      memo.textContent = pick.note
      body.append(memo)
    }

    const acts = document.createElement('div')
    acts.className = 'acts'
    acts.append(
      action(here ? '⤓' : '↗', here ? 'Scroll to element' : 'Open that page and scroll to it', () =>
        this.handlers.onScrollTo(pick.id),
      ),
      // One icon for one action: the button opens the note editor either way, and
      // whether a note exists already is told by colour, as it is on the number.
      action(
        '✎',
        pick.note ? 'Edit note' : 'Add a note',
        () => this.handlers.onEditNote(pick.id),
        pick.note ? 'noted' : '',
      ),
      action('⧉', 'Copy this pick as JSON', () => this.handlers.onCopy(pick.id)),
      action('×', 'Remove this pick', () => this.handlers.onRemove(pick.id), 'danger'),
    )
    body.append(acts)

    row.append(n, body)
    if (here) {
      row.addEventListener('mouseenter', () => this.handlers.onPreview(pick.id))
      row.addEventListener('mouseleave', () => this.handlers.onPreview(null))
    }
    return row
  }
}

function action(label: string, title: string, run: () => void, className = ''): HTMLButtonElement {
  const button = document.createElement('button')
  if (className) button.className = className
  button.textContent = label
  button.title = title
  button.setAttribute('aria-label', title)
  button.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    run()
  })
  return button
}

function pathOf(href: string): string {
  try {
    const url = new URL(href)
    return `${url.pathname}${url.search}` || '/'
  } catch {
    return href
  }
}
