/**
 * Generation of a unique, human-readable CSS selector for a DOM element.
 * Kept dependency-free and side-effect free so it can be unit tested in isolation.
 */

/** Classes added by frameworks/tooling that are unstable across builds. */
const UNSTABLE_CLASS = [
  /^quello-/,
  /^ng-/,
  /^svelte-[a-z0-9]+$/i,
  /^(css|jsx|sc)-[a-z0-9]+$/i,
  /^[\w-]*[-_][a-f0-9]{6,}$/i, // hashed CSS-module suffixes, e.g. `button_a1b2c3`
]

const IDENT_SAFE = /^-?[A-Za-z_][\w-]*$/

export function escapeIdent(value: string): string {
  const cssApi = (globalThis as { CSS?: { escape?: (v: string) => string } }).CSS
  if (typeof cssApi?.escape === 'function') return cssApi.escape(value)
  return value.replace(/([^\w-])/g, '\\$1')
}

/** An id is only useful as a selector if it is a plain, non-numeric identifier. */
export function isUsableId(id: string): boolean {
  return id.length > 0 && IDENT_SAFE.test(id) && !/^\d/.test(id)
}

export function isStableClass(name: string): boolean {
  if (!name || !IDENT_SAFE.test(name)) return false
  return !UNSTABLE_CLASS.some((re) => re.test(name))
}

/** Stable, deduplicated class list in document order. */
export function stableClasses(el: Element): string[] {
  return Array.from(el.classList).filter(isStableClass)
}

function rootOf(el: Element): Document | ShadowRoot {
  const root = el.getRootNode()
  if (root instanceof ShadowRoot) return root
  return el.ownerDocument
}

function matchesUniquely(root: Document | ShadowRoot, selector: string, el: Element): boolean {
  let found: NodeListOf<Element>
  try {
    found = root.querySelectorAll(selector)
  } catch {
    return false
  }
  return found.length === 1 && found[0] === el
}

/** Index of `el` among siblings sharing its tag name, 1-based, as `:nth-of-type` uses. */
export function nthOfType(el: Element): number {
  const parent = el.parentElement
  if (!parent) return 1
  let index = 1
  for (const sibling of Array.from(parent.children)) {
    if (sibling === el) break
    if (sibling.tagName === el.tagName) index++
  }
  return index
}

/** `tag`, narrowed with up to two stable classes, plus `:nth-of-type` when ambiguous. */
function descriptor(el: Element, { withNth }: { withNth: boolean }): string {
  const tag = el.tagName.toLowerCase()
  const classes = stableClasses(el).slice(0, 2)
  let selector = tag + classes.map((c) => `.${escapeIdent(c)}`).join('')

  if (withNth) {
    const parent = el.parentElement
    const ambiguous =
      !!parent && Array.from(parent.children).filter((c) => c.matches(selector)).length > 1
    if (ambiguous) selector += `:nth-of-type(${nthOfType(el)})`
  }
  return selector
}

/**
 * Build the shortest selector that resolves to exactly `el` within its root node,
 * walking up ancestors only as far as disambiguation requires.
 */
export function uniqueSelector(el: Element): string {
  const root = rootOf(el)
  const tag = el.tagName.toLowerCase()
  if (tag === 'html' || tag === 'body') return tag

  const id = el.getAttribute('id')
  if (id && isUsableId(id) && matchesUniquely(root, `#${escapeIdent(id)}`, el)) {
    return `#${escapeIdent(id)}`
  }

  const parts: string[] = []
  let current: Element | null = el

  while (current) {
    const currentId = current.getAttribute('id')
    const isTarget = current === el

    if (!isTarget && currentId && isUsableId(currentId)) {
      const candidate = [`#${escapeIdent(currentId)}`, ...parts].join(' > ')
      if (matchesUniquely(root, candidate, el)) return candidate
    }

    parts.unshift(descriptor(current, { withNth: true }))
    const candidate = parts.join(' > ')
    if (matchesUniquely(root, candidate, el)) return candidate

    const parent: Element | null = current.parentElement
    if (!parent) break
    current = parent
  }

  // Last resort: anchor to the exact position of every ancestor.
  const strict: string[] = []
  for (let node: Element | null = el; node; node = node.parentElement) {
    const name = node.tagName.toLowerCase()
    strict.unshift(name === 'html' ? name : `${name}:nth-of-type(${nthOfType(node)})`)
  }
  return strict.join(' > ')
}

/** Readable ancestor chain, e.g. `html > body > div#app > main > button.cta`. */
export function domPath(el: Element): string {
  const segments: string[] = []
  for (let node: Element | null = el; node; node = node.parentElement) {
    const tag = node.tagName.toLowerCase()
    const id = node.getAttribute('id')
    let segment = tag
    if (id && isUsableId(id)) segment += `#${id}`
    else segment += stableClasses(node).slice(0, 2).map((c) => `.${c}`).join('')
    if (!id && node.parentElement) {
      const siblings = Array.from(node.parentElement.children).filter(
        (c) => c.tagName === node!.tagName,
      )
      if (siblings.length > 1) segment += `[${nthOfType(node)}]`
    }
    segments.unshift(segment)
  }
  return segments.join(' > ')
}

/** Collapse whitespace and truncate, so picks stay small in `picks.json`. */
export function collapseText(input: string | null | undefined, limit = 120): string {
  const text = (input ?? '').replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trimEnd()}…`
}
