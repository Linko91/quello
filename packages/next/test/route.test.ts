import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { quelloRoute } from '../src/route'
import type { QuelloPicksFile } from '@quello/core'

const previous = { cwd: process.cwd(), env: process.env.NODE_ENV }
let root = ''

/** Never let a test write an AGENTS.md into the package it is testing. */
const quiet = { writeAgentFile: false, gitignorePicks: false } as const

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-route-'))
  process.chdir(root)
  process.env.NODE_ENV = 'development'
  delete process.env.QUELLO_OPTIONS
})

afterEach(() => {
  process.chdir(previous.cwd)
  process.env.NODE_ENV = previous.env
})

const pick = (id: number) => ({ id, label: `PICK ${id}`, selector: `#el-${id}` })

const post = (picks: unknown[]) =>
  new Request('http://localhost/api/quello/picks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version: 1, picks }),
  })

describe('quelloRoute', () => {
  it('reads and writes picks below the project root', async () => {
    const { GET, POST } = quelloRoute(quiet)

    expect(await POST(post([pick(1)])).then((r) => r.json())).toMatchObject({ ok: true, count: 1 })
    expect(
      JSON.parse(await readFile(join(root, '.quello', 'picks.json'), 'utf8')) as QuelloPicksFile,
    ).toMatchObject({ picks: [pick(1)] })

    const read = await GET(new Request('http://localhost/api/quello/picks'))
    expect((await read.json()) as QuelloPicksFile).toMatchObject({ picks: [pick(1)] })
  })

  it('honours a custom picksFile', async () => {
    const { POST } = quelloRoute({ ...quiet, picksFile: 'tmp/elsewhere.json' })
    await POST(post([pick(1)]))
    expect(await readFile(join(root, 'tmp', 'elsewhere.json'), 'utf8')).toContain('"id": 1')
  })

  it('serves the runtime bundle', async () => {
    const { GET } = quelloRoute(quiet)
    const response = await GET(new Request('http://localhost/api/quello/client.js'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('javascript')
  })

  it('404s a path below the mount point that is neither route', async () => {
    const { GET } = quelloRoute(quiet)
    expect((await GET(new Request('http://localhost/api/quello/anything'))).status).toBe(404)
  })

  describe('in a production build', () => {
    it('404s every verb, so the endpoint cannot exist outside next dev', async () => {
      process.env.NODE_ENV = 'production'
      const handlers = quelloRoute(quiet)

      for (const [verb, handler] of Object.entries(handlers)) {
        const response = await handler(
          new Request('http://localhost/api/quello/picks', {
            method: verb === 'HEAD' ? 'HEAD' : verb,
            ...(verb === 'POST' || verb === 'PUT' ? { body: '{"picks":[]}' } : {}),
          }),
        )
        expect(response.status, verb).toBe(404)
      }
    })

    it('writes nothing to disk', async () => {
      process.env.NODE_ENV = 'production'
      const { POST } = quelloRoute(quiet)
      await POST(post([pick(1)]))
      await expect(readFile(join(root, '.quello', 'picks.json'), 'utf8')).rejects.toThrow()
    })

    it('stays off even when the config tries to force it on', async () => {
      process.env.NODE_ENV = 'production'
      process.env.QUELLO_OPTIONS = JSON.stringify({ enabled: true })
      const { GET } = quelloRoute(quiet)
      expect((await GET(new Request('http://localhost/api/quello/picks'))).status).toBe(404)
    })
  })
})
