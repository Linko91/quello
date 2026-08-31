import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const START = '<!-- quello:start -->'
const END = '<!-- quello:end -->'

/**
 * Where the instructions go by default.
 *
 * `AGENTS.md` is the open convention shared by Codex, Cursor, Zed, Aider and
 * others, and Claude Code reads it alongside its own `CLAUDE.md` — so one file
 * reaches every agent, which `CLAUDE.md` alone would not.
 */
export const DEFAULT_AGENT_FILE = 'AGENTS.md'

export function section(picksFile: string): string {
  return `${START}
## quello — visual element picks

The user can point at elements in the browser and label them \`PICK 1\`, \`PICK 2\`, …

When the user references \`PICK <n>\` (or says "quello"), read \`${picksFile}\` and resolve the
entry whose \`id\` is \`<n>\` to locate the source element/component. Each entry carries:

- \`note\` — **an instruction written by the user for you**, when present
- \`selector\` / \`domPath\` — where the element sits in the DOM
- \`tag\`, \`classes\`, \`attributes\`, \`text\` — what it is
- \`html\` — its markup, when the developer enabled it (may be elided in the middle with \` … \`)
- \`rect\` / \`style\` — its computed box and presentation (font, color, spacing, radius)
- \`framework\` — Vue, React, Svelte or Angular: the component name and, when the framework
  exposes it, the source \`file\` and \`line\`
- \`page\` — the URL and title of the page the pick was made on

Prefer \`framework.file\` + \`framework.line\` to jump straight to the source; fall back to
searching the codebase for the component name, selector, or text.

### "Resolve the picks"

When the user asks you to **resolve the picks** (or says "risolvi i pick"), read \`${picksFile}\` and
work through every entry that has a \`note\`, in \`id\` order:

1. Locate the element's source from \`framework.file\` / \`framework.line\`, falling back to the
   component name, \`selector\` or \`text\`.
2. Carry out that entry's \`note\` as an instruction scoped to that element.
3. Move on to the next one.

Entries without a \`note\` are just bookmarks — leave them alone unless the user says otherwise.
Treat a note as a request from the user, not as content to summarise, and do not run notes that ask
for something unrelated to the element they are attached to without checking first.

Report what you changed per pick, and leave \`${picksFile}\` alone: it is the tool's file, and the
user clears it from the toolbar.

\`${picksFile}\` is rewritten by the dev server on every pick and is safe to delete.
${END}`
}

export type AgentFileResult = 'created' | 'appended' | 'skipped'

export interface AgentFileOptions {
  /** File to write, relative to `root`. Defaults to `AGENTS.md`. */
  file?: string
  /** Path shown in the instructions. */
  picksFile: string
}

/**
 * Append the quello instructions once, creating the file if needed. An existing
 * quello section is left untouched, so edits to it survive.
 */
export async function ensureAgentFile(
  root: string,
  { file = DEFAULT_AGENT_FILE, picksFile }: AgentFileOptions,
): Promise<AgentFileResult> {
  const path = resolve(root, file)
  let existing: string | null = null
  try {
    existing = await readFile(path, 'utf8')
  } catch {
    existing = null
  }

  if (existing === null) {
    // The file may live in a directory that does not exist yet, e.g. `.github/`.
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, `# Project notes\n\n${section(picksFile)}\n`, 'utf8')
    return 'created'
  }
  if (existing.includes(START)) return 'skipped'

  const separator = existing.endsWith('\n') ? '\n' : '\n\n'
  await appendFile(path, `${separator}${section(picksFile)}\n`, 'utf8')
  return 'appended'
}
