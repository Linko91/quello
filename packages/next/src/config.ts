/**
 * `withQuello` — the one line in `next.config` that makes the other two work.
 *
 * Next has no plugin API: `next.config` is the only file it evaluates on your
 * behalf before anything else runs, which makes it the only place a package can
 * do what a bundler plugin's `buildStart` does. So this is where the agent file
 * and the `.gitignore` entry get written, where the route handler is scaffolded
 * if it is missing, and where the resolved options are published for the
 * component and the route to read.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { resolvePicksPath } from '@quello/server'
import { PICKS_SEGMENT } from '@quello/server/runtime'
import { OPTIONS_ENV, resolveOptions } from './options'
import type { QuelloNextOptions, ResolvedQuelloOptions } from './options'
import { ensureProjectFiles, warn } from './project'

export { DEFAULT_BASE_PATH, isDevelopment, resolveOptions } from './options'
export type { QuelloNextOptions, ResolvedQuelloOptions } from './options'

/**
 * Structural stand-in for `NextConfig`, so the package types cleanly without
 * depending on `next` at type level. Your own config's type is passed through.
 */
export interface NextConfigLike {
  env?: Record<string, string>
  [key: string]: unknown
}

/** Printed once per process, not once per `next.config` evaluation. */
const ANNOUNCED_ENV = '__QUELLO_ANNOUNCED'

function appDirectory(root: string): string | null {
  for (const candidate of ['app', join('src', 'app')]) {
    const path = resolve(root, candidate)
    if (existsSync(path)) return path
  }
  return null
}

const ROUTE_SOURCE = `// Added by quello (@quello/next). Dev-only: a production build answers 404.
import { quelloRoute } from '@quello/next/route'

export const dynamic = 'force-dynamic'

export const { GET, HEAD, POST, PUT, DELETE, OPTIONS } = quelloRoute()
`

function routeFile(appDir: string, basePath: string, typescript: boolean): string {
  const segments = basePath.split('/').filter(Boolean)
  return join(appDir, ...segments, '[...quello]', typescript ? 'route.ts' : 'route.js')
}

/**
 * The file the pre-package docs asked people to write by hand. It has no
 * production guard, so it stays live in a deployed build — worth saying out loud
 * rather than leaving next to a route that supersedes it.
 */
function warnAboutLegacyRoute(appDir: string, basePath: string, root: string): void {
  const segments = basePath.split('/').filter(Boolean)
  for (const extension of ['ts', 'js', 'tsx', 'jsx']) {
    const legacy = join(appDir, ...segments, PICKS_SEGMENT, `route.${extension}`)
    if (!existsSync(legacy)) continue
    warn(
      `${relative(root, legacy)} is the hand-written picks endpoint from before @quello/next.\n` +
        '          It has no production guard — delete it; the route below replaces it.',
    )
    return
  }
}

/** Write the two-line route handler, once, only when nothing is there. */
function scaffoldRoute(root: string, options: ResolvedQuelloOptions): string | null {
  const appDir = appDirectory(root)
  if (!appDir) {
    warn(
      'no app directory found, so the picks endpoint was not created.\n' +
        `          Add it yourself at pages${options.basePath}/[...quello].ts — see https://quello.vercel.app/guides/next`,
    )
    return null
  }

  warnAboutLegacyRoute(appDir, options.basePath, root)

  const typescript = existsSync(resolve(root, 'tsconfig.json'))
  const target = routeFile(appDir, options.basePath, typescript)
  const existing = [target, target.replace(/\.ts$/, '.js'), target.replace(/\.js$/, '.ts')]
  if (existing.some((path) => existsSync(path))) return null

  try {
    mkdirSync(join(target, '..'), { recursive: true })
    writeFileSync(target, ROUTE_SOURCE, 'utf8')
    return relative(root, target)
  } catch (error) {
    warn(`could not create ${relative(root, target)}: ${(error as Error).message}`)
    return null
  }
}

function announce(root: string, options: ResolvedQuelloOptions, created: string | null): void {
  if (process.env[ANNOUNCED_ENV]) return
  process.env[ANNOUNCED_ENV] = '1'

  const lines = [
    '',
    `  quello    press ${options.shortcut} to pick`,
    `  picks     ${relative(root, resolvePicksPath(root, options.picksFile)) || options.picksFile}`,
    `  endpoint  ${options.basePath}/${PICKS_SEGMENT}`,
  ]
  if (options.writeAgentFile) lines.push(`  agent     ${options.agentFile}`)
  if (created) lines.push(`  created   ${created}`)
  lines.push('', '  Render <Quello /> once in your root layout:', '')
  lines.push("    import { Quello } from '@quello/next'", '')
  console.log(lines.join('\n'))
}

/**
 * Wrap your Next config.
 *
 * ```ts
 * import { withQuello } from '@quello/next/config'
 *
 * export default withQuello({
 *   // your config
 * })
 * ```
 *
 * Outside `next dev` this returns the config untouched and does nothing at all.
 */
export function withQuello<T extends NextConfigLike>(
  nextConfig: T = {} as T,
  options: QuelloNextOptions = {},
): T & { env?: Record<string, string> } {
  const resolved = resolveOptions(options)
  if (!resolved.enabled) return nextConfig

  const root = process.cwd()
  const serialized = JSON.stringify(resolved)

  // Both, on purpose. `process.env` covers this process and anything it forks;
  // the config's `env` block covers the module graphs Next compiles, where a
  // `process.env` read is resolved at build time rather than at run time.
  process.env[OPTIONS_ENV] = serialized

  ensureProjectFiles(root, resolved)
  const created = resolved.scaffoldRoute ? scaffoldRoute(root, resolved) : null
  announce(root, resolved, created)

  return {
    ...nextConfig,
    env: { ...(nextConfig.env ?? {}), [OPTIONS_ENV]: serialized },
  }
}

export default withQuello
