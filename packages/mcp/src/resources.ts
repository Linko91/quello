/**
 * The picks as resources, for clients that attach context rather than call tools.
 *
 * Tools give an agent the picks phrased for reading; resources give it the file
 * verbatim. A user who wants to `@`-mention their picks into a chat wants the
 * second, and the JSON here is byte-for-byte what `.quello/picks.json` holds —
 * so anything written against the file format works unchanged against this.
 *
 * URI matching is the SDK's job: `quello://picks` is registered as a fixed uri
 * and `quello://picks/{id}` as a template, so an unknown uri never reaches this
 * file.
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js'
import type { ListResourcesResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'
import { readPicks } from '@quello/server'
import { pickName, summarizePick } from './format'
import { findPick } from './picks'
import type { ToolContext } from './tools'

/** The whole picks file. */
export const PICKS_URI = 'quello://picks'
/** One pick, by the number the user says out loud. */
export const PICK_URI_TEMPLATE = 'quello://picks/{id}'

const MIME = 'application/json'

export const picksResource = {
  name: 'picks',
  uri: PICKS_URI,
  config: {
    title: 'quello picks',
    description:
      'Every element the user picked in the browser, as the raw `.quello/picks.json` payload.',
    mimeType: MIME,
  },
} as const

export const pickResource = {
  name: 'pick',
  template: PICK_URI_TEMPLATE,
  config: {
    title: 'A single quello pick',
    description: 'One pick by its number, as raw JSON — `quello://picks/2` is PICK 2.',
    mimeType: MIME,
  },
} as const

const json = (uri: string, body: unknown): ReadResourceResult => ({
  contents: [{ uri, mimeType: MIME, text: `${JSON.stringify(body, null, 2)}\n` }],
})

/** The whole file, exactly as it sits on disk. */
export async function readPicksResource(
  uri: string,
  { picksPath }: ToolContext,
): Promise<ReadResourceResult> {
  return json(uri, await readPicks(picksPath))
}

/**
 * One pick. The id arrives from the uri template as a string, and a uri that got
 * this far already matched `quello://picks/{id}` — so the only thing left to
 * fail on is a pick that is not there.
 */
export async function readPickResource(
  uri: string,
  id: string,
  { picksPath }: ToolContext,
): Promise<ReadResourceResult> {
  if (!/^\d+$/.test(id)) {
    throw new McpError(ErrorCode.InvalidParams, `"${id}" is not a pick number`, { uri })
  }
  const file = await readPicks(picksPath)
  const pick = findPick(file.picks, Number(id))
  if (!pick) throw new McpError(ErrorCode.InvalidParams, `No PICK ${id} on file`, { uri })
  return json(uri, pick)
}

/**
 * Enumerate the picks that exist right now, so a client can offer them one by one
 * instead of only as a template to fill in by hand.
 */
export async function listPickResources({ picksPath }: ToolContext): Promise<ListResourcesResult> {
  const file = await readPicks(picksPath)
  return {
    resources: file.picks.map((pick) => ({
      uri: `${PICKS_URI}/${pick.id}`,
      name: pickName(pick),
      description: summarizePick(pick),
      mimeType: MIME,
    })),
  }
}
