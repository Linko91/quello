/**
 * The picks as resources, for clients that attach context rather than call tools.
 *
 * Tools give an agent the picks phrased for reading; resources give it the file
 * verbatim. A user who wants to `@`-mention their picks into a chat wants the
 * second, and the JSON here is byte-for-byte what `.quello/picks.json` holds —
 * so anything written against the file format works unchanged against this.
 */
import { readPicks } from '@quello/server'
import { findPick } from './picks'
import { RESOURCE_NOT_FOUND, RpcError } from './protocol'
import type { ToolContext } from './tools'

/** The whole picks file. */
export const PICKS_URI = 'quello://picks'
/** One pick, by the number the user says out loud. */
export const PICK_URI_TEMPLATE = 'quello://picks/{id}'

const MIME = 'application/json'

export interface ResourceDefinition {
  uri: string
  name: string
  title: string
  description: string
  mimeType: string
}

export interface ResourceTemplateDefinition {
  uriTemplate: string
  name: string
  title: string
  description: string
  mimeType: string
}

export const RESOURCES: readonly ResourceDefinition[] = [
  {
    uri: PICKS_URI,
    name: 'picks',
    title: 'quello picks',
    description:
      'Every element the user picked in the browser, as the raw `.quello/picks.json` payload.',
    mimeType: MIME,
  },
]

export const RESOURCE_TEMPLATES: readonly ResourceTemplateDefinition[] = [
  {
    uriTemplate: PICK_URI_TEMPLATE,
    name: 'pick',
    title: 'A single quello pick',
    description: 'One pick by its number, as raw JSON — `quello://picks/2` is PICK 2.',
    mimeType: MIME,
  },
]

export interface ResourceContents {
  contents: Array<{ uri: string; mimeType: string; text: string }>
}

const json = (uri: string, body: unknown): ResourceContents => ({
  contents: [{ uri, mimeType: MIME, text: `${JSON.stringify(body, null, 2)}\n` }],
})

/** `quello://picks/2` → `2`; anything else → `null`. */
export function pickIdFromUri(uri: string): number | null {
  const prefix = `${PICKS_URI}/`
  if (!uri.startsWith(prefix)) return null
  const raw = uri.slice(prefix.length)
  if (!/^\d+$/.test(raw)) return null
  return Number(raw)
}

export async function readResource(uri: string, { picksPath }: ToolContext): Promise<ResourceContents> {
  if (uri === PICKS_URI) return json(uri, await readPicks(picksPath))

  const id = pickIdFromUri(uri)
  if (id !== null) {
    const file = await readPicks(picksPath)
    const pick = findPick(file.picks, id)
    if (!pick) throw new RpcError(RESOURCE_NOT_FOUND, `No PICK ${id} on file`, { uri })
    return json(uri, pick)
  }

  throw new RpcError(RESOURCE_NOT_FOUND, `Unknown resource "${uri}"`, {
    uri,
    available: [PICKS_URI, PICK_URI_TEMPLATE],
  })
}
