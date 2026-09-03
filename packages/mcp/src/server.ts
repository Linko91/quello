/**
 * MCP method dispatch: one decoded message in, one response (or nothing, for a
 * notification) out.
 *
 * Deliberately stateless. A server that remembered whether `initialize` had been
 * called would have one more way to be wrong than one that does not, and every
 * answer here is a fresh read of the picks file anyway.
 */
import {
  failure,
  INTERNAL_ERROR,
  INVALID_PARAMS,
  INVALID_REQUEST,
  isJsonRpcRequest,
  isNotification,
  METHOD_NOT_FOUND,
  RpcError,
  success,
} from './protocol'
import type { JsonRpcId, JsonRpcRequest, JsonRpcResponse } from './protocol'
import { getPrompt, PROMPTS } from './prompts'
import { readResource, RESOURCE_TEMPLATES, RESOURCES } from './resources'
import { callTool, TOOLS } from './tools'
import type { ToolContext } from './tools'

/** Keep in step with this package's `version` — a test asserts they match. */
export const SERVER_VERSION = '0.1.2'
export const SERVER_NAME = 'quello'

/** The revision this server is written against. */
export const LATEST_PROTOCOL_VERSION = '2025-06-18'

/**
 * Revisions we answer to. The surface here — tools, resources, prompts, no
 * batching — is the same across all of them, so a client asking for any of these
 * gets what it asked for; anything else is answered with our own, which is what
 * the spec asks a server to do.
 */
export const SUPPORTED_PROTOCOL_VERSIONS: readonly string[] = [
  '2025-11-25',
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
]

/**
 * Handed to the agent on connect, so it knows what a PICK is before the user
 * mentions one. This is the MCP counterpart of the section the plugins write into
 * `AGENTS.md`, and it has to carry its weight in a couple of hundred words.
 */
export const SERVER_INSTRUCTIONS = `quello is a visual element picker. The user points at elements in their running app in the browser and quello labels them \`PICK 1\`, \`PICK 2\`, … — that is how they will refer to them: "make PICK 2 sticky".

When the user mentions a \`PICK <n>\`, or says "quello", call \`list_picks\` to see what they are pointing at, and \`get_pick\` for every detail of one. Prefer the source file and line a pick carries to jump straight to it; fall back to searching the codebase for the component name, selector or text.

A pick's \`note\` is an instruction the user wrote for you about that element, not a description to summarise. When they ask you to "resolve the picks" (or "risolvi i pick"), call \`resolve_picks\` and work through the notes in \`id\` order, reporting what you changed per pick. Picks without a note are bookmarks — leave them alone unless asked.

Picks are read-only here: the file belongs to quello, and the user clears it from the toolbar.`

export interface QuelloMcpOptions {
  /** Absolute path to the picks file this server answers from. */
  picksPath: string
  /** Reported as `serverInfo.name`. */
  name?: string
  /** Reported as `serverInfo.version`. */
  version?: string
}

export interface QuelloMcpServer {
  readonly picksPath: string
  /** `null` for a notification, which must not be answered. */
  handle(message: unknown): Promise<JsonRpcResponse | null>
}

function negotiate(requested: unknown): string {
  return typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
    ? requested
    : LATEST_PROTOCOL_VERSION
}

/** An id we can quote back even when the envelope was malformed. */
function salvageId(message: unknown): JsonRpcId | null {
  if (!message || typeof message !== 'object') return null
  const id = (message as { id?: unknown }).id
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

function paramsOf(message: JsonRpcRequest): Record<string, unknown> {
  return message.params ?? {}
}

function requiredName(params: Record<string, unknown>, what: string): string {
  const name = params.name
  if (typeof name !== 'string' || name === '') {
    throw new RpcError(INVALID_PARAMS, `${what} requires a "name"`)
  }
  return name
}

function objectArg(value: unknown, key: string): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new RpcError(INVALID_PARAMS, `${key} must be an object`)
  }
  return value as Record<string, unknown>
}

export function createQuelloMcpServer(options: QuelloMcpOptions): QuelloMcpServer {
  const context: ToolContext = { picksPath: options.picksPath }
  const serverInfo = {
    name: options.name ?? SERVER_NAME,
    version: options.version ?? SERVER_VERSION,
  }

  async function dispatch(message: JsonRpcRequest): Promise<unknown> {
    const params = paramsOf(message)

    switch (message.method) {
      case 'initialize':
        return {
          protocolVersion: negotiate(params.protocolVersion),
          capabilities: {
            tools: { listChanged: false },
            // No `subscribe`: watching the file for changes would be a second way
            // to learn something a fresh `tools/call` already tells you.
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
          },
          serverInfo,
          instructions: SERVER_INSTRUCTIONS,
        }

      case 'ping':
        return {}

      case 'tools/list':
        return { tools: TOOLS }

      case 'tools/call':
        return callTool(
          requiredName(params, 'tools/call'),
          objectArg(params.arguments, 'arguments'),
          context,
        )

      case 'resources/list':
        return { resources: RESOURCES }

      case 'resources/templates/list':
        return { resourceTemplates: RESOURCE_TEMPLATES }

      case 'resources/read': {
        const uri = params.uri
        if (typeof uri !== 'string' || uri === '') {
          throw new RpcError(INVALID_PARAMS, 'resources/read requires a "uri"')
        }
        return readResource(uri, context)
      }

      case 'prompts/list':
        return { prompts: PROMPTS }

      case 'prompts/get':
        return getPrompt(
          requiredName(params, 'prompts/get'),
          objectArg(params.arguments, 'arguments'),
          context,
        )

      default:
        throw new RpcError(METHOD_NOT_FOUND, `Unknown method "${message.method}"`)
    }
  }

  return {
    picksPath: options.picksPath,
    async handle(message: unknown): Promise<JsonRpcResponse | null> {
      if (!isJsonRpcRequest(message)) {
        return failure(salvageId(message), INVALID_REQUEST, 'Not a JSON-RPC 2.0 request')
      }
      // Notifications get no answer at all, not even an error: there is no id to
      // address one to. Unknown ones are ignored, as the spec requires.
      if (isNotification(message)) return null

      const id = message.id as JsonRpcId
      try {
        return success(id, await dispatch(message))
      } catch (error) {
        if (error instanceof RpcError) {
          return failure(id, error.code, error.message, error.data)
        }
        return failure(id, INTERNAL_ERROR, (error as Error).message)
      }
    },
  }
}
