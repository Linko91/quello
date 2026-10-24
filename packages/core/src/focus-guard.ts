const FOCUS_EVENTS = ['focus', 'blur', 'focusin', 'focusout'] as const
const KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const

/**
 * Keep the page from reacting to focus and keys inside quello.
 *
 * quello lives outside the page's modals, so a modal's focus trap (Naive UI's
 * NModal/NDrawer, Radix, Headless UI, focus-trap, …) sees focus moving into the
 * note editor as focus escaping the dialog and pulls it straight back: the
 * textarea can't be typed in. Those traps listen on `document`, so focus events
 * that touch quello are stopped in capture on `window`, before they get there.
 * A focus event never reaches quello's own elements either, so nothing inside
 * quello may rely on focus/blur listeners.
 *
 * Keys typed in quello are stopped once they bubble out of its host: its own
 * handlers (the textarea's Enter, the shortcuts on `window` in capture) have run
 * by then, and the page's — a modal closing on Escape — never see them.
 */
export function guardFocus(host: HTMLElement): () => void {
  const onFocusEvent = (event: Event): void => {
    const { relatedTarget } = event as FocusEvent
    const leavingForQuello = (event.type === 'blur' || event.type === 'focusout') && relatedTarget === host
    if (leavingForQuello || event.composedPath().includes(host)) event.stopImmediatePropagation()
  }
  const onKeyEvent = (event: Event): void => event.stopPropagation()

  for (const type of FOCUS_EVENTS) window.addEventListener(type, onFocusEvent, true)
  for (const type of KEY_EVENTS) host.addEventListener(type, onKeyEvent)
  return () => {
    for (const type of FOCUS_EVENTS) window.removeEventListener(type, onFocusEvent, true)
    for (const type of KEY_EVENTS) host.removeEventListener(type, onKeyEvent)
  }
}
