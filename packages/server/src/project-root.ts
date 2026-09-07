import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * Where a project's own files belong: the nearest ancestor of `from` that holds
 * a `package.json`, or `from` itself when none does.
 *
 * A bundler's root is where it *serves* from, which is not always where the
 * project lives. Nuxt 4 sets Vite's root to `app/`; so does any config with
 * `root: 'src'`. `.quello/picks.json`, the agent file and the `.gitignore` entry
 * are project files — an agent is pointed at the repository, not at whichever
 * subdirectory the dev server happens to serve — so they follow the package
 * rather than the served root.
 *
 * Walks up rather than guessing: with no `package.json` anywhere above it (a
 * bare directory, a temp dir) the served root is still the best answer there is.
 */
export function findProjectRoot(from: string): string {
  let current = resolve(from)

  for (;;) {
    if (existsSync(join(current, 'package.json'))) return current
    const parent = dirname(current)
    // `dirname` of a filesystem root returns the root itself, which is the only
    // way this loop ends without a hit.
    if (parent === current) return resolve(from)
    current = parent
  }
}
