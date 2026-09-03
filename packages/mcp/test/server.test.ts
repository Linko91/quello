import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createQuelloMcpServer,
  LATEST_PROTOCOL_VERSION,
  SERVER_INSTRUCTIONS,
  SERVER_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
} from '../src/server'
import type { QuelloMcpServer } from '../src/server'
import {
  INVALID_PARAMS,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  RESOURCE_NOT_FOUND,
} from '../src/protocol'
import type { JsonRpcFailure, JsonRpcSuccess } from '../src/protocol'
import { writePicksFixture } from './fixtures'

let root = ''
let server: QuelloMcpServer

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-server-'))
  server = createQuelloMcpServer({ picksPath: join(root, '.quello', 'picks.json') })
})

let nextId = 0
const send = async (method: string, params?: Record<string, unknown>) => {
  const response = await server.handle({
    jsonrpc: '2.0',
    id: ++nextId,
    method,
    ...(params ? { params } : {}),
  })
  return response as JsonRpcSuccess & JsonRpcFailure
}

const resultOf = async <T>(method: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await send(method, params)
  expect(response.error).toBeUndefined()
  return response.result as T
}

describe('initialize', () => {
  it('answers with capabilities, server info and instructions', async () => {
    const result = await resultOf<Record<string, any>>('initialize', {
      protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    })
    expect(result.protocolVersion).toBe(LATEST_PROTOCOL_VERSION)
    expect(result.capabilities).toEqual({
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false },
    })
    expect(result.serverInfo).toEqual({ name: 'quello', version: SERVER_VERSION })
    expect(result.instructions).toBe(SERVER_INSTRUCTIONS)
  })

  it('agrees to any revision it supports', async () => {
    for (const version of SUPPORTED_PROTOCOL_VERSIONS) {
      const result = await resultOf<{ protocolVersion: string }>('initialize', {
        protocolVersion: version,
      })
      expect(result.protocolVersion).toBe(version)
    }
  })

  it('offers its own revision when asked for one it does not know', async () => {
    for (const version of ['1999-01-01', undefined, 7]) {
      const result = await resultOf<{ protocolVersion: string }>('initialize', {
        protocolVersion: version,
      })
      expect(result.protocolVersion).toBe(LATEST_PROTOCOL_VERSION)
    }
  })

  it('takes the name and version it was built with', async () => {
    const named = createQuelloMcpServer({ picksPath: '/nowhere', name: 'other', version: '9.9.9' })
    const response = (await named.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    })) as JsonRpcSuccess
    expect((response.result as { serverInfo: unknown }).serverInfo).toEqual({
      name: 'other',
      version: '9.9.9',
    })
  })
})

describe('the handshake', () => {
  it('answers before initialize, being stateless — an editor that reconnects still works', async () => {
    await writePicksFixture(root)
    const result = await resultOf<{ tools: unknown[] }>('tools/list')
    expect(result.tools).toHaveLength(3)
  })

  it('says nothing at all to a notification', async () => {
    expect(await server.handle({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBe(null)
  })

  it('ignores a notification it does not know, rather than erroring', async () => {
    expect(await server.handle({ jsonrpc: '2.0', method: 'notifications/whatever' })).toBe(null)
  })

  it('answers a ping with an empty result', async () => {
    expect(await resultOf('ping')).toEqual({})
  })
})

describe('listings', () => {
  it('lists tools, resources, templates and prompts', async () => {
    expect(await resultOf<{ tools: unknown[] }>('tools/list')).toHaveProperty('tools')
    expect(await resultOf<{ resources: unknown[] }>('resources/list')).toHaveProperty('resources')
    expect(
      await resultOf<{ resourceTemplates: unknown[] }>('resources/templates/list'),
    ).toHaveProperty('resourceTemplates')
    expect(await resultOf<{ prompts: unknown[] }>('prompts/list')).toHaveProperty('prompts')
  })
})

describe('tools/call', () => {
  it('runs a tool and returns its text content', async () => {
    await writePicksFixture(root)
    const result = await resultOf<{ content: Array<{ text: string }> }>('tools/call', {
      name: 'list_picks',
      arguments: {},
    })
    expect(result.content[0]?.text).toContain('3 picks:')
  })

  it('works with no arguments key at all', async () => {
    await writePicksFixture(root)
    const result = await resultOf<{ content: Array<{ text: string }> }>('tools/call', {
      name: 'resolve_picks',
    })
    expect(result.content[0]?.text).toContain('to resolve')
  })

  it('needs a name', async () => {
    const response = await send('tools/call', {})
    expect(response.error).toMatchObject({ code: INVALID_PARAMS })
    expect(response.error.message).toContain('requires a "name"')
  })

  it('rejects arguments that are not an object', async () => {
    const response = await send('tools/call', { name: 'list_picks', arguments: [1, 2] })
    expect(response.error).toMatchObject({ code: INVALID_PARAMS })
  })

  it('turns an unknown tool into an invalid-params error', async () => {
    const response = await send('tools/call', { name: 'nope' })
    expect(response.error.code).toBe(INVALID_PARAMS)
    expect(response.error.message).toContain('Unknown tool "nope"')
  })

  it('reports a missing pick inside the result, not as a protocol error', async () => {
    await writePicksFixture(root)
    const result = await resultOf<{ isError: boolean }>('tools/call', {
      name: 'get_pick',
      arguments: { id: 99 },
    })
    expect(result.isError).toBe(true)
  })
})

describe('resources/read', () => {
  it('reads a resource', async () => {
    await writePicksFixture(root)
    const result = await resultOf<{ contents: Array<{ text: string }> }>('resources/read', {
      uri: 'quello://picks/1',
    })
    expect(JSON.parse(result.contents[0]?.text ?? '')).toMatchObject({ id: 1 })
  })

  it('needs a uri', async () => {
    const response = await send('resources/read', {})
    expect(response.error).toMatchObject({ code: INVALID_PARAMS })
  })

  it('passes the resource-not-found code through', async () => {
    const response = await send('resources/read', { uri: 'quello://nope' })
    expect(response.error.code).toBe(RESOURCE_NOT_FOUND)
  })
})

describe('prompts/get', () => {
  it('returns a prompt', async () => {
    await writePicksFixture(root)
    const result = await resultOf<{ messages: unknown[] }>('prompts/get', {
      name: 'resolve-picks',
    })
    expect(result.messages).toHaveLength(1)
  })

  it('needs a name', async () => {
    expect((await send('prompts/get', {})).error.code).toBe(INVALID_PARAMS)
  })
})

describe('bad input', () => {
  it('refuses a message that is not JSON-RPC, quoting the id if it can find one', async () => {
    const response = (await server.handle({ id: 4, method: 'ping' })) as JsonRpcFailure
    expect(response.error.code).toBe(INVALID_REQUEST)
    expect(response.id).toBe(4)
  })

  it('answers with a null id when there was no usable one', async () => {
    for (const message of [null, 'ping', 42, [], { jsonrpc: '2.0' }]) {
      const response = (await server.handle(message)) as JsonRpcFailure
      expect(response.error.code).toBe(INVALID_REQUEST)
      expect(response.id).toBe(null)
    }
  })

  it('refuses a JSON-RPC batch, which MCP no longer allows', async () => {
    const response = (await server.handle([
      { jsonrpc: '2.0', id: 1, method: 'ping' },
    ])) as JsonRpcFailure
    expect(response.error.code).toBe(INVALID_REQUEST)
  })

  it('reports an unknown method as method-not-found', async () => {
    const response = await send('picks/delete')
    expect(response.error.code).toBe(METHOD_NOT_FOUND)
    expect(response.error.message).toContain('picks/delete')
  })

  it('still answers when the picks path is a directory rather than a file', async () => {
    // `readPicks` swallows its own EISDIR, so this ends up as an ordinary
    // "nothing there" answer instead of a crash.
    const broken = createQuelloMcpServer({ picksPath: root })
    const listed = (await broken.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'list_picks', arguments: {} },
    })) as JsonRpcSuccess
    expect((listed.result as { content: Array<{ text: string }> }).content[0]?.text).toContain(
      'No picks yet',
    )

    const missing = (await broken.handle({
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: { uri: 'quello://picks/1' },
    })) as JsonRpcFailure
    expect(missing.error.code).toBe(RESOURCE_NOT_FOUND)
  })

  it('never lets an error escape as a rejected promise', async () => {
    const response = await server.handle({ jsonrpc: '2.0', id: 1, method: 'tools/call' })
    expect(response).toMatchObject({ jsonrpc: '2.0', id: 1 })
  })
})

describe('SERVER_VERSION', () => {
  it('matches the version in package.json', async () => {
    const manifest = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { version: string }
    expect(SERVER_VERSION).toBe(manifest.version)
  })
})

describe('SERVER_INSTRUCTIONS', () => {
  it('teaches the agent what a PICK is and what a note means', () => {
    expect(SERVER_INSTRUCTIONS).toContain('PICK 1')
    expect(SERVER_INSTRUCTIONS).toContain('instruction')
  })

  it('names the three tools, so the agent knows the way in', () => {
    for (const tool of ['list_picks', 'get_pick', 'resolve_picks']) {
      expect(SERVER_INSTRUCTIONS).toContain(tool)
    }
  })

  it('says the picks are read-only', () => {
    expect(SERVER_INSTRUCTIONS).toContain('read-only')
  })

  it('mentions the phrase the user actually says, in both languages', () => {
    expect(SERVER_INSTRUCTIONS).toContain('resolve the picks')
    expect(SERVER_INSTRUCTIONS).toContain('risolvi i pick')
  })
})
