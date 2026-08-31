import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { handleQuelloRequest, picksResponse } from '../src/fetch'
import { MAX_BODY_BYTES } from '../src/routes'
import type { QuelloPicksFile } from '@quello/core'

let picksPath = ''

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), 'quello-fetch-'))
  picksPath = join(root, '.quello', 'picks.json')
})

const pick = (id: number) => ({ id, label: `PICK ${id}`, selector: `#el-${id}` })

const post = (body: unknown, url = 'http://localhost/api/quello/picks') =>
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('picksResponse', () => {
  it('answers an empty file before anything is written', async () => {
    const response = await picksResponse(new Request('http://localhost/picks'), { picksPath })
    expect(response.status).toBe(200)
    const body = (await response.json()) as QuelloPicksFile
    expect(body).toMatchObject({ version: 1, picks: [] })
  })

  it('persists a POST and reads it back', async () => {
    const written = await picksResponse(post({ version: 1, picks: [pick(2), pick(1)] }), {
      picksPath,
    })
    expect(await written.json()).toMatchObject({ ok: true, count: 2 })

    const onDisk = JSON.parse(await readFile(picksPath, 'utf8')) as QuelloPicksFile
    expect(onDisk.picks.map((entry) => entry.id)).toEqual([1, 2])

    const reread = await picksResponse(new Request('http://localhost/picks'), { picksPath })
    expect((await reread.json()) as QuelloPicksFile).toMatchObject({ picks: [pick(1), pick(2)] })
  })

  it('drops malformed picks rather than failing', async () => {
    const response = await picksResponse(post({ picks: [pick(1), { nope: true }, null] }), {
      picksPath,
    })
    expect(await response.json()).toMatchObject({ ok: true, count: 1 })
  })

  it('empties the file on DELETE', async () => {
    await picksResponse(post({ picks: [pick(1)] }), { picksPath })
    const response = await picksResponse(
      new Request('http://localhost/picks', { method: 'DELETE' }),
      { picksPath },
    )
    expect(await response.json()).toMatchObject({ ok: true, count: 0 })
  })

  it('answers a preflight without a body', async () => {
    const response = await picksResponse(
      new Request('http://localhost/picks', { method: 'OPTIONS' }),
      { picksPath, cors: true },
    )
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('sets CORS headers only when asked', async () => {
    const off = await picksResponse(new Request('http://localhost/picks'), { picksPath })
    expect(off.headers.get('access-control-allow-origin')).toBeNull()

    const on = await picksResponse(new Request('http://localhost/picks'), { picksPath, cors: true })
    expect(on.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('refuses a method it does not implement', async () => {
    const response = await picksResponse(
      new Request('http://localhost/picks', { method: 'PATCH' }),
      { picksPath },
    )
    expect(response.status).toBe(405)
  })

  it('reports bad JSON as a 400 rather than throwing', async () => {
    const response = await picksResponse(
      new Request('http://localhost/picks', { method: 'POST', body: '{ not json' }),
      { picksPath },
    )
    expect(response.status).toBe(400)
  })

  it('refuses an oversized body on its declared length alone', async () => {
    const response = await picksResponse(
      new Request('http://localhost/picks', {
        method: 'POST',
        headers: { 'content-length': String(MAX_BODY_BYTES + 1) },
        body: '{}',
      }),
      { picksPath },
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'payload too large' })
  })

  it('cuts off a body that lies about its length', async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(64 * 1024))
      },
    })
    const response = await picksResponse(
      // @ts-expect-error `duplex` is required for a streamed body and not yet in the DOM types.
      new Request('http://localhost/picks', { method: 'POST', body: stream, duplex: 'half' }),
      { picksPath },
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'payload too large' })
  })
})

describe('handleQuelloRequest', () => {
  it('routes on the last segment, whatever it is mounted under', async () => {
    for (const url of [
      'http://localhost/api/quello/picks',
      'http://localhost/_dev/deeply/nested/picks',
      'http://localhost/picks?cachebust=1',
    ]) {
      const response = await handleQuelloRequest(new Request(url), { picksPath })
      expect(response?.status, url).toBe(200)
    }
  })

  it('serves the runtime bundle as JavaScript', async () => {
    const response = await handleQuelloRequest(
      new Request('http://localhost/api/quello/client.js'),
      { picksPath },
    )
    expect(response?.status).toBe(200)
    expect(response?.headers.get('content-type')).toContain('javascript')
  })

  it('returns null for a path it does not own, so the caller decides', async () => {
    const response = await handleQuelloRequest(new Request('http://localhost/api/quello/other'), {
      picksPath,
    })
    expect(response).toBeNull()
  })
})
