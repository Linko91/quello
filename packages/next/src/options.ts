/**
 * The options every entry point shares, and the one place they are resolved.
 *
 * Deliberately free of `node:` imports: this module is reached from the React
 * Server Component as well as from `next.config`, and a bundler that follows it
 * must never trip over a builtin.
 */
import { DEFAULT_AGENT_FILE, DEFAULT_PICKS_FILE } from '@quello/server/runtime'
import type { QuelloHtmlMode, QuelloTheme } from '@quello/core'

/** Where the route handler is mounted, and therefore what `<Quello />` points at. */
export const DEFAULT_BASE_PATH = '/api/quello'

/**
 * How `withQuello` hands its options to the component and the route handler.
 *
 * They run in the same Next process but in different module graphs, and Next
 * gives a package no way to reach across them — so the resolved options travel
 * as JSON through the environment, which `withQuello` sets both on `process.env`
 * and on the config's own `env` block.
 */
export const OPTIONS_ENV = 'QUELLO_OPTIONS'

export interface QuelloNextOptions {
  /**
   * Turn quello off without removing it from the config. Defaults to `true`.
   *
   * This can only ever *disable*: quello is dev-only, and a production build
   * serves nothing whatever this says.
   */
  enabled?: boolean
  /**
   * Where the route handler is mounted. Defaults to `/api/quello`, which is
   * `app/api/quello/[...quello]/route.ts` on disk.
   */
  basePath?: string
  /** Where picks are persisted, relative to the project root. Defaults to `.quello/picks.json`. */
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
   * Add the picks directory to `.gitignore` on first run. Defaults to `true`:
   * picks describe your current browser session, not the project.
   */
  gitignorePicks?: boolean
  /**
   * Create the route handler file if it is missing. Defaults to `true`.
   *
   * Next gives a package no way to add a route, so the file has to exist in the
   * project — this writes the two lines for you rather than asking you to.
   */
  scaffoldRoute?: boolean
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

export type ResolvedQuelloOptions = Required<Omit<QuelloNextOptions, 'theme'>> & {
  theme: QuelloTheme
}

const DEFAULTS: ResolvedQuelloOptions = {
  enabled: true,
  basePath: DEFAULT_BASE_PATH,
  picksFile: DEFAULT_PICKS_FILE,
  shortcut: 'alt+q',
  textLimit: 120,
  writeAgentFile: true,
  agentFile: DEFAULT_AGENT_FILE,
  gitignorePicks: true,
  scaffoldRoute: true,
  htmlMode: 'truncated',
  htmlLimit: 1000,
  theme: {},
}

/** `true` only while `next dev` is running. */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/** Whatever `withQuello` published, or nothing when it was never called. */
function fromEnvironment(): QuelloNextOptions {
  // Dot access on purpose: Next inlines `process.env.QUELLO_OPTIONS` from the
  // config's `env` block, and falls back to a real lookup when it is not set.
  const raw = process.env.QUELLO_OPTIONS
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as QuelloNextOptions) : {}
  } catch {
    return {}
  }
}

function defined<T extends object>(source: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

/**
 * Defaults, then whatever `withQuello` published, then the call's own overrides.
 *
 * `enabled` is the exception: it is ANDed with the development check rather than
 * merged, so no combination of config and props can serve quello in production.
 */
export function resolveOptions(overrides: QuelloNextOptions = {}): ResolvedQuelloOptions {
  const merged: ResolvedQuelloOptions = {
    ...DEFAULTS,
    ...defined(fromEnvironment()),
    ...defined(overrides),
  }
  return {
    ...merged,
    basePath: `/${merged.basePath.replace(/^\/+|\/+$/g, '')}`,
    enabled: merged.enabled && isDevelopment(),
  }
}
