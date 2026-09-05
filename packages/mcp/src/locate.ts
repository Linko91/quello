/**
 * Finding `.quello/picks.json`.
 *
 * The plugins never have to look: they are the dev server, so the project root is
 * whatever they were configured with. An MCP server is launched by the editor,
 * from whichever directory the editor happened to be in — so the working
 * directory is a hint, not an answer, and this climbs until it finds something
 * that looks like the project.
 */
import { access, stat } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { DEFAULT_PICKS_FILE, resolvePicksPath } from '@quello/server'

/** Files that mean "this directory is the top of a project". */
const ROOT_MARKERS = ['package.json', '.git']

export interface LocateOptions {
  /** Where to start looking. Defaults to `process.cwd()`. */
  cwd?: string
  /** Project root, when the caller already knows it — the `--root` flag. */
  root?: string
  /** Picks file, absolute or relative to the root — the `--picks-file` flag. */
  picksFile?: string
  /** Where `QUELLO_ROOT` and `QUELLO_PICKS_FILE` are read from. Defaults to `process.env`. */
  env?: Record<string, string | undefined>
}

export interface PicksLocation {
  /** Absolute path to the picks file. */
  path: string
  /** Directory the path was resolved against. */
  root: string
  /** `true` when the file is on disk right now — it is absent until the first pick. */
  found: boolean
  /** How the root was decided, for the startup banner. */
  via: 'option' | 'env' | 'discovered' | 'cwd'
}

/** Whether a path can be reached at all. Shared with the tool layer, which needs
 * to tell "no picks yet" from "no picks file yet". */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * When the picks file was last written, ISO-8601, or `null` when it is not there.
 *
 * Read from the filesystem rather than from the file's own `updatedAt`, because
 * the store restamps that field to *now* every time it normalizes — so a value
 * that came back through `readPicks` would always claim the picks were fresh.
 * The mtime is the honest answer to "how old is this?".
 */
export async function modifiedAt(path: string): Promise<string | null> {
  try {
    return (await stat(path)).mtime.toISOString()
  } catch {
    return null
  }
}

/** Nearest ancestor of `from` (itself included) that `probe` accepts. */
async function walkUp(
  from: string,
  probe: (dir: string) => Promise<boolean>,
): Promise<string | null> {
  let dir = from
  for (;;) {
    if (await probe(dir)) return dir
    const parent = dirname(dir)
    // `dirname('/') === '/'`, which is how the climb ends.
    if (parent === dir) return null
    dir = parent
  }
}

async function hasMarker(dir: string): Promise<boolean> {
  for (const marker of ROOT_MARKERS) {
    if (await fileExists(join(dir, marker))) return true
  }
  return false
}

/**
 * Work out which picks file this server should read, in order of how much the
 * caller told us: an explicit root, the environment, then discovery.
 *
 * An existing picks file wins over a project marker — a monorepo has a
 * `package.json` at every level, but only the app you are picking in has picks.
 */
export async function locatePicks(options: LocateOptions = {}): Promise<PicksLocation> {
  const env = options.env ?? process.env
  const cwd = resolve(options.cwd ?? process.cwd())
  const picksFile = options.picksFile ?? env.QUELLO_PICKS_FILE ?? DEFAULT_PICKS_FILE

  const explicit = options.root ?? env.QUELLO_ROOT
  if (explicit) {
    const root = resolve(cwd, explicit)
    const path = resolvePicksPath(root, picksFile)
    return { path, root, found: await fileExists(path), via: options.root ? 'option' : 'env' }
  }

  if (!isAbsolute(picksFile)) {
    const withPicks = await walkUp(cwd, (dir) => fileExists(join(dir, picksFile)))
    if (withPicks) {
      return { path: join(withPicks, picksFile), root: withPicks, found: true, via: 'discovered' }
    }
    const withMarker = await walkUp(cwd, hasMarker)
    if (withMarker) {
      return {
        path: join(withMarker, picksFile),
        root: withMarker,
        found: false,
        via: 'discovered',
      }
    }
  }

  const path = resolvePicksPath(cwd, picksFile)
  return { path, root: cwd, found: await fileExists(path), via: 'cwd' }
}
