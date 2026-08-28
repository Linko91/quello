import { QuelloPicker } from './picker'
import type { QuelloInstance, QuelloOptions } from './types'

export { QuelloPicker } from './picker'
export { collectAttributes } from './attributes'
export { copyText, describeCopy, formatPicks } from './clipboard'
export { clampToViewport, draggable, EDGE_MARGIN } from './drag'
export { Overlay } from './overlay'
export { collectStyle } from './style'
export {
  collectHtml,
  DEFAULT_SETTINGS,
  loadSettings,
  MAX_HTML_LIMIT,
  MIN_HTML_LIMIT,
  normalizeSettings,
  saveSettings,
  truncateMiddle,
} from './settings'
export { PicksTransport } from './transport'
export { detectFramework, detectReact, detectVue } from './framework'
export {
  collapseText,
  domPath,
  escapeIdent,
  isStableClass,
  isUsableId,
  nthOfType,
  stableClasses,
  uniqueSelector,
} from './selector'
export type * from './types'

declare global {
  interface Window {
    __quello__?: QuelloInstance
  }
}

/** Create (or return the existing) picker for this page. */
export function createQuello(options: QuelloOptions = {}): QuelloInstance {
  if (typeof window === 'undefined') {
    throw new Error('[quello] createQuello() requires a browser environment')
  }
  if (window.__quello__) return window.__quello__
  const instance = new QuelloPicker(options)
  window.__quello__ = instance
  return instance
}
