import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { createQuelloMcpServer } from '../src/server'
import { serveStdio } from '../src/stdio'
import type { MessageOutput } from '../src/stdio'
import type { JsonRpcResponse } from '../src/protocol'
import { PARSE_ERROR } from '../src/protocol'
import { writePicksFixture } from './fixtures'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-stdio-'))
  picksPath = join(root, '.quello', 'picks.json')
})

/** An in-memory stdout that keeps what was written to it. */
function collector(): MessageOutput & { chunks: string[]; messages(): JsonRpcResponse[] } {
  const chunks: string[] = []
  return {
    chunks,
    write(chunk: string) {
      chunks.push(chunk)
      return true
    },
    messages() {
      return chunks
        .join('')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as JsonRpcResponse)
    },
  }
}

/** Feed the transport a fixed set of chunks, as stdin would deliver them. */
async function* stream(...chunks: Array<string | Uint8Array>) {
  for (const chunk of chunks) yield chunk
}

const run = async (...chunks: Array<string | Uint8Array>) => {
  const output = collector()
  await serveStdio(createQuelloMcpServer({ picksPath }), stream(...chunks), output)
  return output
}

const request = (id: number, method: string, params?: unknown) =>
  `${JSON.stringify({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) })}\n`

describe('serveStdio', () => {
  it('answers one message per line, in order', async () => {
    const output = await run(request(1, 'ping'), request(2, 'tools/list'))
    expect(output.messages().map((message) => message.id)).toEqual([1, 2])
  })

  it('writes exactly one newline-terminated line per response', async () => {
    const output = await run(request(1, 'ping'))
    expect(output.chunks).toHaveLength(1)
    expect(output.chunks[0]?.endsWith('\n')).toBe(true)
    expect(output.chunks[0]?.trimEnd().split('\n')).toHaveLength(1)
  })

  it('reassembles a message split across chunks', async () => {
    const whole = request(1, 'ping')
    const output = await run(whole.slice(0, 12), whole.slice(12, 25), whole.slice(25))
    expect(output.messages()).toHaveLength(1)
    expect(output.messages()[0]?.id).toBe(1)
  })

  it('handles several messages arriving in one chunk', async () => {
    const output = await run(`${request(1, 'ping')}${request(2, 'ping')}${request(3, 'ping')}`)
    expect(output.messages()).toHaveLength(3)
  })

  it('reads Buffer chunks, which is what stdin actually delivers', async () => {
    const output = await run(Buffer.from(request(1, 'ping'), 'utf8'))
    expect(output.messages()[0]?.id).toBe(1)
  })

  it('reassembles a multi-byte character split across chunks', async () => {
    const bytes = Buffer.from(
      request(1, 'tools/call', { name: 'list_picks', arguments: { page: 'sett…ings' } }),
      'utf8',
    )
    // Cut inside the three bytes that make up the ellipsis, which is what a
    // streaming decoder has to hold back rather than turn into a replacement
    // character.
    const cut = bytes.indexOf(Buffer.from('…', 'utf8')) + 1
    const output = await run(bytes.subarray(0, cut), bytes.subarray(cut))

    expect(output.messages()).toHaveLength(1)
    const [message] = output.messages() as Array<{ result: { content: Array<{ text: string }> } }>
    // Echoed back intact, which a mangled decode would not manage.
    expect(message?.result.content[0]?.text).toContain('pages matching "sett…ings"')
  })

  it('answers a line that is not JSON with a parse error and no id', async () => {
    const output = await run('this is not json\n')
    const [message] = output.messages()
    expect(message).toMatchObject({ id: null })
    expect((message as { error: { code: number } }).error.code).toBe(PARSE_ERROR)
  })

  it('carries on after a parse error', async () => {
    const output = await run(`nonsense\n${request(2, 'ping')}`)
    expect(output.messages().map((message) => message.id)).toEqual([null, 2])
  })

  it('skips blank lines without answering them', async () => {
    const output = await run(`\n\n${request(1, 'ping')}\n  \n`)
    expect(output.messages()).toHaveLength(1)
  })

  it('says nothing in reply to a notification', async () => {
    const output = await run(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`)
    expect(output.chunks).toEqual([])
  })

  it('answers a last message that arrived without a trailing newline', async () => {
    const output = await run(request(1, 'ping').trimEnd())
    expect(output.messages()[0]?.id).toBe(1)
  })

  it('resolves when the input ends, which is how an editor shuts it down', async () => {
    await expect(run(request(1, 'ping'))).resolves.toBeDefined()
  })

  it('resolves on an input that was empty from the start', async () => {
    const output = await run()
    expect(output.chunks).toEqual([])
  })

  it('answers a real tools/call over the wire', async () => {
    await writePicksFixture(root)
    const output = await run(
      request(1, 'tools/call', { name: 'get_pick', arguments: { id: 2 } }),
    )
    const result = (output.messages()[0] as { result: { content: Array<{ text: string }> } }).result
    expect(result.content[0]?.text).toContain('make this sticky on scroll')
  })

  it('completes a whole session: initialize, initialized, list, call', async () => {
    await writePicksFixture(root)
    const output = await run(
      request(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {} }),
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
      request(2, 'tools/list'),
      request(3, 'tools/call', { name: 'resolve_picks', arguments: {} }),
    )
    // Four messages in, three out: the notification is not answered.
    expect(output.messages().map((message) => message.id)).toEqual([1, 2, 3])
    for (const message of output.messages()) expect(message).not.toHaveProperty('error')
  })
})
