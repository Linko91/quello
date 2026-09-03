/**
 * JSON-RPC 2.0, the subset MCP speaks.
 *
 * Hand-rolled rather than taken from a dependency, for the same reason the rest
 * of quello hand-rolls its HTTP: the wire format is a line of JSON, and the
 * official SDK would put ten transitive packages behind a server whose whole job
 * is to read one file and hand it over. Nothing here is quello-specific, and
 * nothing here touches the filesystem — it is the envelope, not the payload.
 */

export const JSONRPC_VERSION = '2.0'

export type JsonRpcId = string | number

/** A request carries an `id` and expects an answer; a notification has none. */
export interface JsonRpcRequest {
  jsonrpc: typeof JSONRPC_VERSION
  id?: JsonRpcId | null
  method: string
  params?: Record<string, unknown>
}

export interface JsonRpcSuccess {
  jsonrpc: typeof JSONRPC_VERSION
  id: JsonRpcId
  result: unknown
}

export interface JsonRpcFailure {
  jsonrpc: typeof JSONRPC_VERSION
  /** `null` when the request was unreadable, so there was no id to quote back. */
  id: JsonRpcId | null
  error: { code: number; message: string; data?: unknown }
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure

/** The codes JSON-RPC reserves, plus the one MCP adds for a missing resource. */
export const PARSE_ERROR = -32700
export const INVALID_REQUEST = -32600
export const METHOD_NOT_FOUND = -32601
export const INVALID_PARAMS = -32602
export const INTERNAL_ERROR = -32603
/** MCP's own: `resources/read` for a uri the server does not serve. */
export const RESOURCE_NOT_FOUND = -32002

/** An error meant to travel back as a JSON-RPC `error`, code included. */
export class RpcError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly data?: unknown,
  ) {
    super(message)
    this.name = 'RpcError'
  }
}

export function success(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: JSONRPC_VERSION, id, result }
}

export function failure(
  id: JsonRpcId | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcFailure {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  }
}

/** `true` for a well-formed request or notification. */
export function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const message = value as Partial<JsonRpcRequest>
  if (message.jsonrpc !== JSONRPC_VERSION) return false
  if (typeof message.method !== 'string' || message.method === '') return false
  if (message.id !== undefined && message.id !== null) {
    if (typeof message.id !== 'string' && typeof message.id !== 'number') return false
  }
  if (message.params !== undefined) {
    if (!message.params || typeof message.params !== 'object' || Array.isArray(message.params))
      return false
  }
  return true
}

/** A notification is a request with no `id`: it must not be answered. */
export function isNotification(message: JsonRpcRequest): boolean {
  return message.id === undefined || message.id === null
}

/**
 * One message per line. `JSON.stringify` escapes newlines inside strings, so a
 * message can never break its own framing — which is what the stdio transport
 * relies on.
 */
export function encode(message: JsonRpcResponse): string {
  return `${JSON.stringify(message)}\n`
}

/**
 * Split a buffer into whole lines, keeping whatever came after the last newline
 * for the next chunk. Blank lines are dropped rather than reported as parse
 * errors: they carry no message.
 */
export function splitLines(buffer: string): { lines: string[]; rest: string } {
  const parts = buffer.split('\n')
  const rest = parts.pop() ?? ''
  return { lines: parts.map((line) => line.trim()).filter((line) => line !== ''), rest }
}
