/**
 * Best-effort recovery of component metadata from framework internals.
 * Everything here is defensive: dev-only internals change between versions and
 * a failure to read them must never break picking.
 */
import type { FrameworkInfo } from './types'

interface VueComponentType {
  name?: string
  __name?: string
  __file?: string
  displayName?: string
}

interface VueInternalInstance {
  type?: VueComponentType
  parent?: VueInternalInstance | null
}

interface ReactDebugSource {
  fileName?: string
  lineNumber?: number
  columnNumber?: number
}

interface ReactFiber {
  type?: unknown
  elementType?: unknown
  return?: ReactFiber | null
  _debugSource?: ReactDebugSource
  _debugOwner?: ReactFiber | null
}

const MAX_WALK = 50

function basename(file: string): string {
  const parts = file.split(/[\\/]/)
  return parts[parts.length - 1] ?? file
}

function nameFromFile(file: string | undefined): string | undefined {
  if (!file) return undefined
  return basename(file).replace(/\.[jt]sx?$|\.vue$/, '') || undefined
}

/** `data-v-inspector="src/App.vue:12:3"`, emitted by vite-plugin-vue-inspector. */
function parseVueInspector(el: Element): FrameworkInfo | null {
  let node: Element | null = el
  for (let i = 0; node && i < MAX_WALK; i++, node = node.parentElement) {
    const raw = node.getAttribute('data-v-inspector')
    if (!raw) continue
    const match = /^(.*?):(\d+):(\d+)$/.exec(raw)
    if (!match) return { framework: 'vue', file: raw }
    const [, file, line, column] = match
    return {
      framework: 'vue',
      component: nameFromFile(file),
      file,
      line: Number(line),
      column: Number(column),
    }
  }
  return null
}

function vueInstanceOf(el: Element): VueInternalInstance | null {
  const withInternals = el as Element & {
    __vueParentComponent?: VueInternalInstance
    __vue__?: { $options?: VueComponentType }
  }
  if (withInternals.__vueParentComponent) return withInternals.__vueParentComponent
  const vue2 = withInternals.__vue__
  if (vue2?.$options) return { type: vue2.$options }
  return null
}

export function detectVue(el: Element): FrameworkInfo | null {
  let node: Element | null = el
  for (let i = 0; node && i < MAX_WALK; i++, node = node.parentElement) {
    const instance = vueInstanceOf(node)
    if (!instance) continue

    // Skip anonymous wrappers until a named component (or a source file) shows up.
    let candidate: VueInternalInstance | null | undefined = instance
    for (let depth = 0; candidate && depth < MAX_WALK; depth++) {
      const type = candidate.type
      const name = type?.__name ?? type?.name ?? type?.displayName ?? nameFromFile(type?.__file)
      if (name || type?.__file) {
        return {
          framework: 'vue',
          ...(name ? { component: name } : {}),
          ...(type?.__file ? { file: type.__file } : {}),
        }
      }
      candidate = candidate.parent
    }
    return { framework: 'vue' }
  }
  return parseVueInspector(el)
}

function fiberOf(el: Element): ReactFiber | null {
  for (const key of Object.keys(el)) {
    if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
      return (el as unknown as Record<string, ReactFiber>)[key] ?? null
    }
  }
  return null
}

function componentNameOf(type: unknown): string | undefined {
  if (typeof type === 'function') {
    const fn = type as { displayName?: string; name?: string }
    return fn.displayName || fn.name || undefined
  }
  if (type && typeof type === 'object') {
    const obj = type as { displayName?: string; render?: { name?: string } }
    return obj.displayName || obj.render?.name || undefined
  }
  return undefined
}

export function detectReact(el: Element): FrameworkInfo | null {
  let node: Element | null = el
  for (let i = 0; node && i < MAX_WALK; i++, node = node.parentElement) {
    const fiber = fiberOf(node)
    if (!fiber) continue

    let current: ReactFiber | null | undefined = fiber
    let source: ReactDebugSource | undefined
    for (let depth = 0; current && depth < MAX_WALK; depth++) {
      source ??= current._debugSource
      const name = componentNameOf(current.type ?? current.elementType)
      if (name) {
        return {
          framework: 'react',
          component: name,
          ...(source?.fileName ? { file: source.fileName } : {}),
          ...(source?.lineNumber ? { line: source.lineNumber } : {}),
          ...(source?.columnNumber ? { column: source.columnNumber } : {}),
        }
      }
      current = current.return
    }
    return { framework: 'react' }
  }
  return null
}

/** Returns metadata for whichever framework owns the element, or `null`. */
export function detectFramework(el: Element): FrameworkInfo | null {
  try {
    return detectVue(el) ?? detectReact(el)
  } catch {
    return null
  }
}
