import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const MARKER = '# quello — visual element picks (generated, safe to delete)'

/**
 * What to ignore for a given picks file. A file inside its own directory means the
 * directory goes in — `.quello/picks.json` is really `.quello/` — while a picks
 * file kept at the project root only ignores itself.
 */
export function ignorePattern(picksFile: string): string {
  const dir = dirname(picksFile)
  return dir === '.' || dir === '' ? picksFile : `${dir.replace(/\/+$/, '')}/`
}

/** `true` when some line already ignores this pattern, in any of its usual spellings. */
export function alreadyIgnored(contents: string, pattern: string): boolean {
  const bare = pattern.replace(/\/+$/, '')
  const forms = new Set([pattern, bare, `${bare}/`, `/${bare}`, `/${bare}/`, `${bare}/*`])
  return contents
    .split('\n')
    .map((line) => line.trim())
    .some((line) => forms.has(line))
}

export type GitignoreResult = 'created' | 'appended' | 'skipped'

/**
 * Add the picks directory to `.gitignore`, once. Picks describe the browser session
 * in front of you, not the project, so they have no business in a commit — but this
 * edits a file the developer owns, so it never rewrites and never duplicates.
 */
export async function ensureGitignored(
  root: string,
  { picksFile }: { picksFile: string },
): Promise<GitignoreResult> {
  const path = resolve(root, '.gitignore')
  const pattern = ignorePattern(picksFile)
  const block = `${MARKER}\n${pattern}\n`

  let existing: string | null = null
  try {
    existing = await readFile(path, 'utf8')
  } catch {
    existing = null
  }

  if (existing === null) {
    await writeFile(path, block, 'utf8')
    return 'created'
  }
  if (alreadyIgnored(existing, pattern)) return 'skipped'

  const separator = existing.endsWith('\n') ? '\n' : '\n\n'
  await appendFile(path, `${separator}${block}`, 'utf8')
  return 'appended'
}
