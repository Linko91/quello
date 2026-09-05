/**
 * A real MCP client wired to a real server over the SDK's in-memory transport.
 *
 * Since the SDK owns the protocol, the tests that matter most are the ones that
 * go through it: schema validation, uri-template matching and error mapping are
 * all its behaviour, not ours, and asserting them against our own idea of the
 * protocol would prove nothing.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createQuelloMcpServer } from '../src/server'
import type { QuelloMcpOptions } from '../src/server'

export async function connect(options: QuelloMcpOptions): Promise<Client> {
  const server = createQuelloMcpServer(options)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'quello-tests', version: '0.0.0' })
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)])
  return client
}

/** The text of a tool result, which is the only content type quello returns. */
export function textOf(result: { content?: unknown }): string {
  const content = (result.content ?? []) as Array<{ type: string; text?: string }>
  return content
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('\n')
}
