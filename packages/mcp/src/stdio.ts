/**
 * The stdio transport: newline-delimited JSON-RPC on stdin and stdout.
 *
 * Typed against `AsyncIterable` and a bare `write` rather than against node's
 * streams, so a test can drive it with two arrays and no process.
 *
 * The one rule that matters: **stdout carries the protocol and nothing else.**
 * A stray `console.log` anywhere in this package would land in the middle of a
 * message and desynchronise the client, which is why every human-readable line
 * this package prints goes to stderr.
 */
import { encode, failure, PARSE_ERROR, splitLines } from './protocol'
import type { JsonRpcResponse } from './protocol'
import type { QuelloMcpServer } from './server'

/** stdin, or anything shaped like it. Node's `Readable` already qualifies. */
export type MessageInput = AsyncIterable<string | Uint8Array>

/** stdout, or anything shaped like it. */
export interface MessageOutput {
  write(chunk: string): unknown
}

async function handleLine(
  server: QuelloMcpServer,
  line: string,
): Promise<JsonRpcResponse | null> {
  let message: unknown
  try {
    message = JSON.parse(line)
  } catch (error) {
    // No id to quote back — the line never parsed far enough to have one.
    return failure(null, PARSE_ERROR, `Invalid JSON: ${(error as Error).message}`)
  }
  return server.handle(message)
}

/**
 * Read messages until the input ends, answering each on the output. Resolves when
 * stdin closes, which is how an editor tells an MCP server to shut down.
 */
export async function serveStdio(
  server: QuelloMcpServer,
  input: MessageInput,
  output: MessageOutput,
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''

  const drain = async (flush: boolean): Promise<void> => {
    const { lines, rest } = splitLines(flush ? `${buffer}\n` : buffer)
    buffer = flush ? '' : rest
    for (const line of lines) {
      const response = await handleLine(server, line)
      if (response) output.write(encode(response))
    }
  }

  for await (const chunk of input) {
    buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true })
    await drain(false)
  }

  // A stream that ends without a trailing newline still ended on a whole message.
  if (buffer.trim() !== '') await drain(true)
}
