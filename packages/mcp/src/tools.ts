/**
 * The three tools: their descriptions, their zod schemas, and what each one does.
 *
 * Registration lives in `server.ts`; argument validation and dispatch belong to
 * the SDK, which builds the JSON Schema clients see from the shapes below.
 *
 * All three are read-only. The instructions the plugins write into `AGENTS.md`
 * end with "leave the picks file alone: it is the tool's file, and the user
 * clears it from the toolbar" — an MCP server that could rewrite picks would
 * contradict that, and would let an agent renumber the very labels the user says
 * out loud. So picks come out of here and never go back in.
 *
 * Every call re-reads the file. The user goes on picking while the agent works,
 * and a cached list would answer with the picks from a minute ago.
 */
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'
import type { QuelloPick } from '@quello/core'
import { readPicks } from '@quello/server'
import { z } from 'zod'
import { describePick, describeSource, formatPickList, formatResolvePlan } from './format'
import { modifiedAt } from './locate'
import { filterPicks, findPick } from './picks'

export interface ToolContext {
  picksPath: string
}

/** Every tool here only ever reads. */
const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
}

/**
 * A pick number. Accepts `2` and `"2"`, because agents hand numbers over as
 * strings often enough to be worth taking; refuses `true`, `null` and `1.5`,
 * which `z.coerce.number()` would quietly turn into a pick that exists.
 */
export const pickId = z
  .union([z.number().int(), z.string().regex(/^\d+$/)])
  .transform(Number)
  .refine((id) => id >= 1, { message: 'must be a pick number, e.g. 2 for PICK 2' })

export const listPicksTool = {
  name: 'list_picks',
  config: {
    title: 'List picks',
    description:
      'List the elements the user picked in the browser with quello. Each one is labelled ' +
      'PICK <n>, which is how the user refers to it out loud ("make PICK 2 sticky"). ' +
      'Returns one line per pick — its element, source file and note. Call this whenever the ' +
      'user mentions a PICK number or says "quello", to find out what they are pointing at.',
    inputSchema: {
      detail: z
        .enum(['summary', 'full'])
        .optional()
        .describe(
          'summary (default) is one line per pick; full is every recorded field of every pick.',
        ),
      page: z
        .string()
        .optional()
        .describe(
          'Keep only picks made on pages whose url or title contains this, case-insensitive, e.g. "/settings".',
        ),
      withNotes: z
        .boolean()
        .optional()
        .describe(
          'Keep only picks carrying a note — the ones that are instructions rather than bookmarks.',
        ),
    },
    annotations: READ_ONLY,
  },
} as const

export const getPickTool = {
  name: 'get_pick',
  config: {
    title: 'Get one pick',
    description:
      'Every recorded detail of a single pick, by its number: the source file and line, the ' +
      'component name, selector, DOM path, text, attributes, computed style, box and page. ' +
      'Use it to locate the element in the codebase before editing it.',
    inputSchema: { id: pickId.describe('The pick number, i.e. 2 for PICK 2.') },
    annotations: READ_ONLY,
  },
} as const

/**
 * No `inputSchema`, deliberately — not an empty one. An empty shape is still an
 * object schema, and the SDK would validate `params.arguments` against it, so a
 * client calling this tool with no `arguments` key at all (which is the normal
 * way to call a tool that takes none) would be told its arguments were invalid.
 */
export const resolvePicksTool = {
  name: 'resolve_picks',
  config: {
    title: 'Resolve the picks',
    description:
      'The picks that carry a note, in id order, as a work list. A note is an instruction the ' +
      'user wrote for you about that specific element. Call this when the user asks you to ' +
      '"resolve the picks" (or "risolvi i pick"), then carry out each note against the element ' +
      'it is attached to.',
    annotations: READ_ONLY,
  },
} as const

/** Names only, for the places that want to talk about the set. */
export const TOOL_NAMES = [listPicksTool.name, getPickTool.name, resolvePicksTool.name] as const

const text = (body: string, isError?: boolean): CallToolResult => ({
  content: [{ type: 'text', text: body }],
  ...(isError ? { isError: true } : {}),
})

/**
 * Load the picks, and a header line saying where they came from and how old they
 * are — an agent that knows the picks are two hours stale can say so instead of
 * acting on them.
 */
async function load(picksPath: string): Promise<{ picks: QuelloPick[]; source: string }> {
  const stamp = await modifiedAt(picksPath)
  const file = await readPicks(picksPath)
  return {
    picks: file.picks,
    source: stamp
      ? describeSource(picksPath, stamp)
      : `${picksPath} — not created yet; quello writes it on the first pick`,
  }
}

/** How a filtered-to-nothing result should describe what it looked for. */
function scopeOf(page: string | undefined, withNotes: boolean | undefined): string | undefined {
  const parts: string[] = []
  if (withNotes) parts.push('with a note')
  if (page !== undefined) parts.push(`on pages matching "${page}"`)
  return parts.length ? parts.join(' ') : undefined
}

export interface ListPicksArgs {
  detail?: 'summary' | 'full'
  page?: string
  withNotes?: boolean
}

export async function listPicks(
  { detail, page, withNotes }: ListPicksArgs,
  { picksPath }: ToolContext,
): Promise<CallToolResult> {
  const { picks, source } = await load(picksPath)
  const selected = filterPicks(picks, { page, withNotes })
  return text(
    formatPickList(selected, {
      detail: detail ?? 'summary',
      source,
      scope: scopeOf(page, withNotes),
    }),
  )
}

export async function getPick(
  { id }: { id: number },
  { picksPath }: ToolContext,
): Promise<CallToolResult> {
  const { picks, source } = await load(picksPath)
  const pick = findPick(picks, id)
  if (!pick) {
    const available = picks.map((entry) => entry.id)
    // An `isError` result rather than a thrown McpError: a pick number that is
    // not there is a condition the agent should read and react to, not a
    // protocol mistake.
    return text(
      available.length === 0
        ? `There is no PICK ${id}: no picks have been made yet. The user makes them in the browser — Alt+Q, then click an element.\n\n${source}`
        : `There is no PICK ${id}. Picks currently on file: ${available.join(', ')}.\n\n${source}`,
      true,
    )
  }
  return text(`${source}\n\n${describePick(pick)}`)
}

export async function resolvePicks({ picksPath }: ToolContext): Promise<CallToolResult> {
  const { picks, source } = await load(picksPath)
  return text(formatResolvePlan(picks, source))
}
