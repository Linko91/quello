import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { ensureClaudeMd } from './claude-md'
import { DEFAULT_PICKS_FILE, normalize, readPicks, resolvePicksPath, writePicks } from './store'

import type { QuelloHtmlMode } from '@quello/core'

export type { QuelloHtmlMode, QuelloPick, QuelloPicksFile, QuelloSettings } from '@quello/core'

const CLIENT_ROUTE = '/__quello/client.js'
const PICKS_ROUTE = '/__quello/picks'
const MAX_BODY_BYTES = 2_000_000

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
  /** Append the quello section to CLAUDE.md on first run. Defaults to `true`. */
  claudeMd?: boolean
  /**
   * Initial HTML capture mode. Defaults to `truncated`. Only a starting point:
   * once a developer picks a mode in the settings panel, their choice wins.
   */
  htmlMode?: QuelloHtmlMode
  /** Initial character budget for `htmlMode: 'truncated'`. Defaults to `1000`. */
  htmlLimit?: number
}

const requireFrom = createRequire(import.meta.url)

/** Absolute path of the prebuilt, self-executing core runtime. */
function clientBundlePath(): string {
  return requireFrom.resolve('@quello/core/client')
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(payload)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
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
    claudeMd = true,
    htmlMode = 'truncated',
    htmlLimit = 1000,
  } = options

  let picksPath = ''
  let root = process.cwd()

  return {
    name: 'vite-plugin-quello',
    apply: 'serve',
    enforce: 'post',

    configResolved(config) {
      root = config.root
      picksPath = resolvePicksPath(root, picksFile)
    },

    async buildStart() {
      if (!enabled || !claudeMd) return
      try {
        await ensureClaudeMd(root, picksFile)
      } catch (error) {
        this.warn(`[quello] could not update CLAUDE.md: ${(error as Error).message}`)
      }
    },

    configureServer(server) {
      if (!enabled) return

      server.middlewares.use(CLIENT_ROUTE, async (_req, res) => {
        try {
          const code = await readFile(clientBundlePath(), 'utf8')
          res.statusCode = 200
          res.setHeader('content-type', 'application/javascript; charset=utf-8')
          res.setHeader('cache-control', 'no-cache')
          res.end(code)
        } catch (error) {
          res.statusCode = 500
          res.end(`console.error(${JSON.stringify(`[quello] runtime not built: ${(error as Error).message}`)})`)
        }
      })

      server.middlewares.use(PICKS_ROUTE, async (req, res) => {
        try {
          if (req.method === 'GET' || req.method === 'HEAD') {
            send(res, 200, await readPicks(picksPath))
            return
          }
          if (req.method === 'POST' || req.method === 'PUT') {
            const body = await readBody(req)
            const written = await writePicks(picksPath, normalize(JSON.parse(body || '{}')))
            send(res, 200, { ok: true, count: written.picks.length, file: picksPath })
            return
          }
          if (req.method === 'DELETE') {
            await writePicks(picksPath, { version: 1, updatedAt: '', picks: [] })
            send(res, 200, { ok: true, count: 0 })
            return
          }
          send(res, 405, { ok: false, error: 'method not allowed' })
        } catch (error) {
          send(res, 400, { ok: false, error: (error as Error).message })
        }
      })
    },

    transformIndexHtml(_html, ctx) {
      if (!enabled || !ctx.server) return
      return [
        {
          tag: 'script',
          injectTo: 'body',
          attrs: {
            src: CLIENT_ROUTE,
            defer: true,
            'data-quello-endpoint': PICKS_ROUTE,
            'data-quello-shortcut': shortcut,
            'data-quello-text-limit': String(textLimit),
            'data-quello-html-mode': htmlMode,
            'data-quello-html-limit': String(htmlLimit),
          },
        },
      ]
    },
  }
}

export { quello }
