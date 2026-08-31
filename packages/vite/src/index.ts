import type { Plugin } from 'vite'
import {
  CLIENT_ROUTE,
  coreEsmPath,
  DEFAULT_AGENT_FILE,
  DEFAULT_PICKS_FILE,
  ensureAgentFile,
  PICKS_ROUTE,
  resolvePicksPath,
  runtimeAttrs,
  serveClient,
  servePicks,
} from '@quello/server'
import type { QuelloHtmlMode, QuelloTheme } from '@quello/core'

export type {
  QuelloHtmlMode,
  QuelloPick,
  QuelloPicksFile,
  QuelloSettings,
  QuelloTheme,
} from '@quello/core'

/**
 * Import target for frameworks that render their own HTML — Nuxt, Astro, SvelteKit,
 * Qwik — where `transformIndexHtml` is never called. Importing it from a client-only
 * file starts quello with the same options the plugin was given.
 */
const VIRTUAL_ID = 'virtual:quello'
const RESOLVED_VIRTUAL_ID = '\0virtual:quello'

export interface QuelloPluginOptions {
  /** Turn the plugin off without removing it from the config. Defaults to `true`. */
  enabled?: boolean
  /** Where picks are persisted, relative to the Vite root. Defaults to `.quello/picks.json`. */
  picksFile?: string
  /**
   * Keyboard shortcut that toggles picker mode, declared in full — `alt+q`,
   * `ctrl+shift+p`, `f2`. Nothing is implied, so a combination without Alt works
   * just as well. Defaults to `alt+q`.
   */
  shortcut?: string
  /** Characters of element text kept per pick. Defaults to `120`. */
  textLimit?: number
  /** Write the quello instructions into an agent file on first run. Defaults to `true`. */
  writeAgentFile?: boolean
  /**
   * Which file to write them to, relative to the project root. Defaults to
   * `AGENTS.md`, the open convention Claude Code, Codex, Cursor and others read.
   * Any path works: `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`.
   */
  agentFile?: string
  /**
   * Initial HTML capture mode. Defaults to `truncated`. Only a starting point:
   * once a developer picks a mode in the settings panel, their choice wins.
   */
  htmlMode?: QuelloHtmlMode
  /** Initial character budget for `htmlMode: 'truncated'`. Defaults to `1000`. */
  htmlLimit?: number
  /**
   * Look of the outlines quello draws on the page. Code-level only — deliberately
   * absent from the toolbar, which is for what you change while working.
   */
  theme?: QuelloTheme
}

/**
 * Dev-only Vite plugin: injects the quello runtime and persists picks to disk
 * so a coding agent can resolve `PICK <n>` back to source.
 */
export default function quello(options: QuelloPluginOptions = {}): Plugin {
  const {
    enabled = true,
    picksFile = DEFAULT_PICKS_FILE,
    shortcut = 'alt+q',
    textLimit = 120,
    writeAgentFile = true,
    agentFile = DEFAULT_AGENT_FILE,
    htmlMode = 'truncated',
    htmlLimit = 1000,
    theme = {},
  } = options

  let picksPath = ''
  let root = process.cwd()

  const runtime = { endpoint: PICKS_ROUTE, shortcut, textLimit, htmlMode, htmlLimit, theme }

  return {
    name: 'vite-plugin-quello',
    apply: 'serve',
    enforce: 'post',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : null
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null
      if (!enabled) return 'export {}'
      return [
        `import { createQuello } from ${JSON.stringify(coreEsmPath())}`,
        `createQuello(${JSON.stringify(runtime)})`,
        'export {}',
      ].join('\n')
    },

    configResolved(config) {
      root = config.root
      picksPath = resolvePicksPath(root, picksFile)
    },

    async buildStart() {
      if (!enabled || !writeAgentFile) return
      try {
        await ensureAgentFile(root, { file: agentFile, picksFile })
      } catch (error) {
        this.warn(`[quello] could not update ${agentFile}: ${(error as Error).message}`)
      }
    },

    configureServer(server) {
      if (!enabled) return
      server.middlewares.use(CLIENT_ROUTE, (_req, res) => void serveClient(res))
      server.middlewares.use(PICKS_ROUTE, (req, res) => void servePicks(req, res, { picksPath }))
    },

    transformIndexHtml(_html, ctx) {
      if (!enabled || !ctx.server) return
      return [
        {
          tag: 'script',
          injectTo: 'body',
          attrs: { src: CLIENT_ROUTE, defer: true, ...runtimeAttrs(runtime) },
        },
      ]
    },
  }
}

export { quello }
