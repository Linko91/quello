/**
 * The three tools, and the argument checking in front of them.
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
import type { QuelloPick } from '@quello/core'
import { readPicks } from '@quello/server'
import { describePick, describeSource, formatPickList, formatResolvePlan } from './format'
import { modifiedAt } from './locate'
import { filterPicks, findPick } from './picks'
import { INVALID_PARAMS, RpcError } from './protocol'

/** A JSON Schema object, as far as MCP cares. */
export interface ToolSchema {
  type: 'object'
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

export interface ToolDefinition {
  name: string
  title: string
  description: string
  inputSchema: ToolSchema
  annotations?: Record<string, unknown>
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>
  /** `true` for a failure the agent should read and react to, rather than a protocol error. */
  isError?: boolean
}

export interface ToolContext {
  picksPath: string
}

/** Every tool here only ever reads. */
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true }

export const TOOLS: readonly ToolDefinition[] = [
  {
    name: 'list_picks',
    title: 'List picks',
    description:
      'List the elements the user picked in the browser with quello. Each one is labelled ' +
      'PICK <n>, which is how the user refers to it out loud ("make PICK 2 sticky"). ' +
      'Returns one line per pick — its element, source file and note. Call this whenever the ' +
      'user mentions a PICK number or says "quello", to find out what they are pointing at.',
    inputSchema: {
      type: 'object',
      properties: {
        detail: {
          type: 'string',
          enum: ['summary', 'full'],
          description:
            'summary (default) is one line per pick; full is every recorded field of every pick.',
        },
        page: {
          type: 'string',
          description:
            'Keep only picks made on pages whose url or title contains this, case-insensitive, e.g. "/settings".',
        },
        withNotes: {
          type: 'boolean',
          description:
            'Keep only picks carrying a note — the ones that are instructions rather than bookmarks.',
        },
      },
      additionalProperties: false,
    },
    annotations: READ_ONLY,
  },
  {
    name: 'get_pick',
    title: 'Get one pick',
    description:
      'Every recorded detail of a single pick, by its number: the source file and line, the ' +
      'component name, selector, DOM path, text, attributes, computed style, box and page. ' +
      'Use it to locate the element in the codebase before editing it.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          minimum: 1,
          description: 'The pick number, i.e. 2 for PICK 2.',
        },
      },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: READ_ONLY,
  },
  {
    name: 'resolve_picks',
    title: 'Resolve the picks',
    description:
      'The picks that carry a note, in id order, as a work list. A note is an instruction the ' +
      'user wrote for you about that specific element. Call this when the user asks you to ' +
      '"resolve the picks" (or "risolvi i pick"), then carry out each note against the element ' +
      'it is attached to.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY,
  },
]

function args(input: Record<string, unknown> | undefined): Record<string, unknown> {
  return input ?? {}
}

function optionalString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') throw new RpcError(INVALID_PARAMS, `${key} must be a string`)
  return value
}

function optionalBoolean(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = input[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'boolean') throw new RpcError(INVALID_PARAMS, `${key} must be a boolean`)
  return value
}

function optionalEnum<T extends string>(
  input: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = optionalString(input, key)
  if (value === undefined) return undefined
  if (!allowed.includes(value as T)) {
    throw new RpcError(INVALID_PARAMS, `${key} must be one of ${allowed.join(', ')}`)
  }
  return value as T
}

function requiredId(input: Record<string, unknown>): number {
  const value = input.id
  // Agents hand numbers over as strings often enough to be worth accepting.
  const id = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    throw new RpcError(INVALID_PARAMS, 'id must be an integer, e.g. 2 for PICK 2')
  }
  return id
}

const text = (body: string, isError?: boolean): ToolResult =>
  isError ? { content: [{ type: 'text', text: body }], isError: true } : { content: [{ type: 'text', text: body }] }

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

/**
 * Run a tool. Throws {@link RpcError} for arguments that cannot be read — a
 * protocol mistake — and returns `isError` results for conditions the agent
 * should reason about, like a pick number that is not there.
 */
export async function callTool(
  name: string,
  input: Record<string, unknown> | undefined,
  { picksPath }: ToolContext,
): Promise<ToolResult> {
  const given = args(input)

  if (name === 'list_picks') {
    const detail = optionalEnum(given, 'detail', ['summary', 'full'] as const)
    const page = optionalString(given, 'page')
    const withNotes = optionalBoolean(given, 'withNotes')
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

  if (name === 'get_pick') {
    const id = requiredId(given)
    const { picks, source } = await load(picksPath)
    const pick = findPick(picks, id)
    if (!pick) {
      const available = picks.map((entry) => entry.id)
      return text(
        available.length === 0
          ? `There is no PICK ${id}: no picks have been made yet. The user makes them in the browser — Alt+Q, then click an element.\n\n${source}`
          : `There is no PICK ${id}. Picks currently on file: ${available.join(', ')}.\n\n${source}`,
        true,
      )
    }
    return text(`${source}\n\n${describePick(pick)}`)
  }

  if (name === 'resolve_picks') {
    const { picks, source } = await load(picksPath)
    return text(formatResolvePlan(picks, source))
  }

  throw new RpcError(
    INVALID_PARAMS,
    `Unknown tool "${name}". Available: ${TOOLS.map((tool) => tool.name).join(', ')}.`,
  )
}
