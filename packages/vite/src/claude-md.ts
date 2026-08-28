import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const START = '<!-- quello:start -->'
const END = '<!-- quello:end -->'

export function section(picksFile: string): string {
  return `${START}
## quello — visual element picks

The user can point at elements in the browser and label them \`PICK 1\`, \`PICK 2\`, …

When the user references \`PICK <n>\` (or says "quello"), read \`${picksFile}\` and resolve the
entry whose \`id\` is \`<n>\` to locate the source element/component. Each entry carries:

- \`selector\` / \`domPath\` — where the element sits in the DOM
- \`tag\`, \`classes\`, \`attributes\`, \`text\` — what it is
- \`html\` — its markup, when the developer enabled it (may be elided in the middle with \` … \`)
- \`rect\` / \`style\` — its computed box and presentation (font, color, spacing, radius)
- \`framework\` — component name and, when available, the source \`file\` and \`line\`
- \`page\` — the URL and title of the page the pick was made on

Prefer \`framework.file\` + \`framework.line\` to jump straight to the source; fall back to
searching the codebase for the component name, selector, or text.

\`${picksFile}\` is rewritten by the dev server on every pick and is safe to delete.
${END}`
}

/**
 * Append the quello instructions to CLAUDE.md once, creating the file if needed.
 * An existing quello section is left untouched so user edits survive.
 */
export async function ensureClaudeMd(root: string, picksFile: string): Promise<'created' | 'appended' | 'skipped'> {
  const path = resolve(root, 'CLAUDE.md')
  let existing: string | null = null
  try {
    existing = await readFile(path, 'utf8')
  } catch {
    existing = null
  }

  if (existing === null) {
    await writeFile(path, `# Project notes\n\n${section(picksFile)}\n`, 'utf8')
    return 'created'
  }
  if (existing.includes(START)) return 'skipped'

  const separator = existing.endsWith('\n') ? '\n' : '\n\n'
  await appendFile(path, `${separator}${section(picksFile)}\n`, 'utf8')
  return 'appended'
}
