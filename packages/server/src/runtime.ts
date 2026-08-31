/**
 * The isomorphic half of the server package: route names and the `data-quello-*`
 * attributes every integration spells the same way. Deliberately free of `node:`
 * imports so it can be reached from a React Server Component or any other place
 * a bundler would refuse to follow `node:fs` into — hence the dedicated
 * `@quello/server/runtime` export.
 */
import type { QuelloTheme } from '@quello/core'

/** Where the runtime bundle is served from by the Vite and webpack dev servers. */
export const CLIENT_ROUTE = '/__quello/client.js'
/** Where picks are read and written by the Vite and webpack dev servers. */
export const PICKS_ROUTE = '/__quello/picks'

/**
 * The last segment of each route. Integrations that cannot own a top-level path
 * — Next, where a `_`-prefixed directory is excluded from routing — mount the
 * pair somewhere else and match on these.
 */
export const CLIENT_SEGMENT = 'client.js'
export const PICKS_SEGMENT = 'picks'

/** Where picks are persisted, relative to the project root. */
export const DEFAULT_PICKS_FILE = '.quello/picks.json'

/**
 * Where the agent instructions go by default.
 *
 * `AGENTS.md` is the open convention shared by Codex, Cursor, Zed, Aider and
 * others, and Claude Code reads it alongside its own `CLAUDE.md` — so one file
 * reaches every agent, which `CLAUDE.md` alone would not.
 */
export const DEFAULT_AGENT_FILE = 'AGENTS.md'

export interface RuntimeOptions {
  endpoint?: string
  shortcut?: string
  textLimit?: number
  htmlMode?: string
  htmlLimit?: number
  /** Values are stringified as they are; only the keys that are set are emitted. */
  theme?: QuelloTheme
}

/**
 * `data-quello-*` attributes for a script tag. Kebab-cased here so every
 * integration spells them the same way.
 */
export function runtimeAttrs(options: RuntimeOptions): Record<string, string> {
  const attrs: Record<string, string> = {}
  const set = (name: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== '')
      attrs[`data-quello-${name}`] = String(value)
  }
  set('endpoint', options.endpoint ?? PICKS_ROUTE)
  set('shortcut', options.shortcut)
  set('text-limit', options.textLimit)
  set('html-mode', options.htmlMode)
  set('html-limit', options.htmlLimit)
  for (const [key, value] of Object.entries(options.theme ?? {})) {
    set(key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), value)
  }
  return attrs
}
