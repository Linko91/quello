import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import type { ServerResponse } from 'node:http'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

/**
 * Resolve a URL path inside `root`, refusing anything that escapes it. Serving
 * files means `../..` has to be answered, even on a dev-only server.
 */
export function resolveWithin(root: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/')
  const target = resolve(root, `.${normalize(decoded)}`)
  return target === root || target.startsWith(root + sep) ? target : null
}

/** Send a file, falling back to `index.html` inside a directory. */
export async function serveFile(res: ServerResponse, path: string): Promise<boolean> {
  let target = path
  try {
    const info = await stat(target)
    if (info.isDirectory()) target = join(target, 'index.html')
    await stat(target)
  } catch {
    return false
  }
  res.statusCode = 200
  res.setHeader('content-type', TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream')
  res.setHeader('cache-control', 'no-store')
  createReadStream(target).pipe(res)
  return true
}
