/**
 * Entry point for the self-executing bundle injected by vite-plugin-quello.
 * Reads its configuration from the `data-quello-*` attributes on its own script tag.
 */
import { createQuello } from './index'
import type { QuelloOptions } from './types'

function readOptions(): QuelloOptions {
  const script = document.currentScript as HTMLScriptElement | null
  const data = script?.dataset ?? {}
  const options: QuelloOptions = {}
  if (data.quelloEndpoint) options.endpoint = data.quelloEndpoint
  if (data.quelloShortcut) options.shortcutKey = data.quelloShortcut
  if (data.quelloTextLimit) options.textLimit = Number(data.quelloTextLimit)
  return options
}

const options = readOptions()

function start(): void {
  createQuello(options)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
