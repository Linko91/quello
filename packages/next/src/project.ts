/**
 * The dev-time side effects the Vite and webpack plugins get from a build hook,
 * done here from wherever quello is first reached — `next.config` when
 * `withQuello` is used, the route module otherwise.
 */
import { ensureAgentFile, ensureGitignored } from '@quello/server'
import type { ResolvedQuelloOptions } from './options'

export function warn(message: string): void {
  console.warn(`[quello] ${message}`)
}

let written = false

/**
 * Write the agent instructions and the `.gitignore` entry, once per process.
 * Both are idempotent and both leave an existing file alone, so running twice
 * across module graphs costs nothing.
 */
export function ensureProjectFiles(root: string, options: ResolvedQuelloOptions): void {
  if (written) return
  written = true

  if (options.writeAgentFile) {
    void ensureAgentFile(root, { file: options.agentFile, picksFile: options.picksFile }).catch(
      (error: Error) => warn(`could not update ${options.agentFile}: ${error.message}`),
    )
  }
  if (options.gitignorePicks) {
    void ensureGitignored(root, { picksFile: options.picksFile }).catch((error: Error) =>
      warn(`could not update .gitignore: ${error.message}`),
    )
  }
}
