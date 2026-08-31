/**
 * The picks endpoint and the runtime bundle, as a Next route handler.
 *
 * Next runs its own dev server, so there is no middleware stack to add these to
 * the way the Vite and webpack plugins do — the pair has to be a route the
 * project mounts. Everything else about it is the same code every integration
 * runs, and the production guard is the part a hand-written handler forgets.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  CLIENT_SEGMENT,
  handleQuelloRequest,
  resolvePicksPath,
  serveClient,
  servePicks,
} from '@quello/server'
import { resolveOptions } from './options'
import type { QuelloNextOptions } from './options'
import { ensureProjectFiles } from './project'

export type { QuelloNextOptions, ResolvedQuelloOptions } from './options'

type RouteHandler = (request: Request) => Promise<Response>

/** What an App Router `route.ts` re-exports. Every verb, so nothing 405s by accident. */
export interface QuelloRouteHandlers {
  GET: RouteHandler
  HEAD: RouteHandler
  POST: RouteHandler
  PUT: RouteHandler
  DELETE: RouteHandler
  OPTIONS: RouteHandler
}

const notFound = (): Response => new Response(null, { status: 404 })

/**
 * Handlers for `app/<basePath>/[...quello]/route.ts`:
 *
 * ```ts
 * import { quelloRoute } from '@quello/next/route'
 *
 * export const { GET, POST, PUT, DELETE, OPTIONS } = quelloRoute()
 * ```
 *
 * In a production build every method answers `404` — the endpoint writes to the
 * filesystem, so it must not exist outside `next dev`.
 */
export function quelloRoute(options: QuelloNextOptions = {}): QuelloRouteHandlers {
  const resolved = resolveOptions(options)
  const picksPath = resolvePicksPath(process.cwd(), resolved.picksFile)

  // A project that mounts the route without `withQuello` still gets its agent
  // file and `.gitignore` entry.
  if (resolved.enabled) ensureProjectFiles(process.cwd(), resolved)

  const handler: RouteHandler = async (request) => {
    if (!resolved.enabled) return notFound()
    return (await handleQuelloRequest(request, { picksPath })) ?? notFound()
  }

  return {
    GET: handler,
    HEAD: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    OPTIONS: handler,
  }
}

/**
 * The Pages Router equivalent, for `pages/api/quello/[...quello].ts`. Pair it
 * with `quelloApiConfig`, or the body arrives already parsed and the handler has
 * nothing left to read.
 *
 * ```ts
 * import { quelloApiConfig, quelloApiRoute } from '@quello/next/route'
 *
 * export const config = quelloApiConfig
 * export default quelloApiRoute()
 * ```
 */
export function quelloApiRoute(
  options: QuelloNextOptions = {},
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const resolved = resolveOptions(options)
  const picksPath = resolvePicksPath(process.cwd(), resolved.picksFile)

  if (resolved.enabled) ensureProjectFiles(process.cwd(), resolved)

  return async (req, res) => {
    if (!resolved.enabled) {
      res.statusCode = 404
      res.end()
      return
    }
    const path = (req.url ?? '').split('?')[0] ?? ''
    if (path.endsWith(`/${CLIENT_SEGMENT}`)) {
      await serveClient(res)
      return
    }
    await servePicks(req, res, { picksPath })
  }
}

/** Next's per-route config for `quelloApiRoute`: quello reads the body itself. */
export const quelloApiConfig = { api: { bodyParser: false } } as const
