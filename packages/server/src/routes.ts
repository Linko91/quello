import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { QuelloTheme } from '@quello/core'
import { normalize, readPicks, writePicks } from './store'

export const CLIENT_ROUTE = '/__quello/client.js'
export const PICKS_ROUTE = '/__quello/picks'

const MAX_BODY_BYTES = 2_000_000
const requireFrom = createRequire(import.meta.url)

/** Absolute path of the prebuilt, self-executing core runtime. */
export function clientBundlePath(): string {
  return requireFrom.resolve('@quello/core/client')
}

/** The core's ESM build, for bundlers that import it by absolute path. */
export function coreEsmPath(): string {
  return join(dirname(requireFrom.resolve('@quello/core/package.json')), 'dist', 'index.js')
}

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
    if (value !== undefined && value !== null && value !== '') attrs[`data-quello-${name}`] = String(value)
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

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
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

export interface HandlerOptions {
  /** Absolute path of the picks file. */
  picksPath: string
  /**
   * Allow requests from another origin. Needed when the app is served by one dev
   * server and quello's endpoint by another — an Angular app and `quello serve`,
   * say. Dev-only, and off unless asked for.
   */
  cors?: boolean
}

/** Serve the runtime bundle. Returns `true` when it handled the request. */
export async function serveClient(res: ServerResponse): Promise<void> {
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
}

/** Read and write the picks file over HTTP. */
export async function servePicks(
  req: IncomingMessage,
  res: ServerResponse,
  { picksPath, cors }: HandlerOptions,
): Promise<void> {
  if (cors) {
    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('access-control-allow-headers', 'content-type')
  }
  try {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }
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
}

/**
 * One connect-style middleware covering both routes, for any dev server that
 * takes them — Vite, webpack, or a plain node server.
 */
export function quelloMiddleware(options: HandlerOptions) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    const path = (req.url ?? '').split('?')[0]
    if (path === CLIENT_ROUTE) {
      void serveClient(res)
      return
    }
    if (path === PICKS_ROUTE) {
      void servePicks(req, res, options)
      return
    }
    next()
  }
}
