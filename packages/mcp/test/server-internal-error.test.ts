/**
 * The last resort in `handle`: a throw that is not an `RpcError` still has to
 * come back as a JSON-RPC error rather than as a rejected promise, or the
 * transport loop dies and the editor is left with a server that has stopped
 * answering.
 *
 * Every layer under the dispatch guards its own filesystem access, so there is no
 * input that reaches this branch — which is the point of it. Making the store
 * throw is the only honest way to prove the net is there. It lives in its own file
 * because the mock applies to the whole module.
 */
import { describe, expect, it, vi } from 'vitest'
import { INTERNAL_ERROR } from '../src/protocol'
import type { JsonRpcFailure } from '../src/protocol'

vi.mock('@quello/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@quello/server')>()),
  readPicks: vi.fn(() => {
    throw new Error('disk went away')
  }),
}))

const { createQuelloMcpServer } = await import('../src/server')

describe('an unexpected throw', () => {
  const server = createQuelloMcpServer({ picksPath: '/nowhere/picks.json' })

  const send = (method: string, params?: Record<string, unknown>) =>
    server.handle({ jsonrpc: '2.0', id: 1, method, ...(params ? { params } : {}) }) as Promise<
      JsonRpcFailure
    >

  it('becomes an internal error, with the message kept', async () => {
    const response = await send('tools/call', { name: 'list_picks', arguments: {} })
    expect(response.error).toMatchObject({ code: INTERNAL_ERROR, message: 'disk went away' })
    expect(response.id).toBe(1)
  })

  it('is caught the same way for a resource read', async () => {
    expect((await send('resources/read', { uri: 'quello://picks' })).error.code).toBe(INTERNAL_ERROR)
  })

  it('is caught the same way for a prompt', async () => {
    expect((await send('prompts/get', { name: 'resolve-picks' })).error.code).toBe(INTERNAL_ERROR)
  })

  it('never rejects, whatever went wrong underneath', async () => {
    await expect(send('tools/call', { name: 'resolve_picks' })).resolves.toBeDefined()
  })
})
