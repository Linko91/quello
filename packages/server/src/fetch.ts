/**
 * The same two routes as `routes.ts`, against the Web `Request`/`Response` pair
 * instead of node's `IncomingMessage`/`ServerResponse`.
 *
 * Frameworks that own their server — Next route handlers, SvelteKit endpoints,
 * Astro, Nitro, Hono — hand you a `Request` and expect a `Response` back. There
 * is no dev-server middleware to plug into, so the integration is a route the
 * project mounts itself, and this is the handler behind it.
 */
import { CLIENT_SEGMENT, PICKS_SEGMENT } from './runtime'
import { MAX_BODY_BYTES, readClientBundle } from './routes'
import type { HandlerOptions } from './routes'
import { normalize, readPicks, writePicks } from './store'

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type',
}

function json(body: unknown, status: number, cors: boolean | undefined): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(cors ? CORS_HEADERS : {}),
    },
  })
}

/**
 * Read the body without ever holding more than `MAX_BODY_BYTES`. A declared
 * `content-length` is refused before a byte is read; a body that lies about its
 * length is cut off mid-stream.
 */
async function readBody(request: Request): Promise<string> {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new Error('payload too large')

  const stream = request.body
  if (!stream) {
    const text = await request.text()
    if (text.length > MAX_BODY_BYTES) throw new Error('payload too large')
    return text
  }

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    size += value.byteLength
    if (size > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new Error('payload too large')
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

/** Serve the runtime bundle. Never throws: a failure comes back as console output. */
export async function clientResponse(): Promise<Response> {
  try {
    return new Response(await readClientBundle(), {
      status: 200,
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-cache',
      },
    })
  } catch (error) {
    const message = `[quello] runtime not built: ${(error as Error).message}`
    return new Response(`console.error(${JSON.stringify(message)})`, {
      status: 500,
      headers: { 'content-type': 'application/javascript; charset=utf-8' },
    })
  }
}

/** Read and write the picks file, the `Request`/`Response` way. */
export async function picksResponse(
  request: Request,
  { picksPath, cors }: HandlerOptions,
): Promise<Response> {
  try {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors ? CORS_HEADERS : {} })
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      return json(await readPicks(picksPath), 200, cors)
    }
    if (request.method === 'POST' || request.method === 'PUT') {
      const body = await readBody(request)
      const written = await writePicks(picksPath, normalize(JSON.parse(body || '{}')))
      return json({ ok: true, count: written.picks.length, file: picksPath }, 200, cors)
    }
    if (request.method === 'DELETE') {
      await writePicks(picksPath, { version: 1, updatedAt: '', picks: [] })
      return json({ ok: true, count: 0 }, 200, cors)
    }
    return json({ ok: false, error: 'method not allowed' }, 405, cors)
  } catch (error) {
    return json({ ok: false, error: (error as Error).message }, 400, cors)
  }
}

/**
 * Route a request to whichever handler its **last path segment** names, so the
 * pair can be mounted anywhere: `/api/quello/picks`, `/_quello/picks`, or a
 * catch-all several segments deep. Returns `null` when the path is neither, for
 * the caller to answer as it sees fit.
 */
export async function handleQuelloRequest(
  request: Request,
  options: HandlerOptions,
): Promise<Response | null> {
  const segment = new URL(request.url).pathname.split('/').filter(Boolean).pop()
  if (segment === CLIENT_SEGMENT) return clientResponse()
  if (segment === PICKS_SEGMENT) return picksResponse(request, options)
  return null
}
