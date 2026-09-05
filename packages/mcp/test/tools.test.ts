/**
 * The tool handlers on their own. The SDK's part — validation, dispatch, error
 * mapping — is covered in `server.test.ts` through a real client; this is what
 * each tool actually answers.
 */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { getPick, listPicks, pickId, resolvePicks, TOOL_NAMES } from '../src/tools'
import type { ListPicksArgs } from '../src/tools'
import { allPicks, buyButton, writePicksFixture } from './fixtures'
import { textOf } from './client'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-tools-'))
  picksPath = join(root, '.quello', 'picks.json')
  // The directory exists but the file does not, which is the state a project is
  // in between installing quello and making the first pick.
  await mkdir(join(root, '.quello'), { recursive: true })
})

const list = async (args: ListPicksArgs = {}) => textOf(await listPicks(args, { picksPath }))
const single = (id: number) => getPick({ id }, { picksPath })
const resolve = async () => textOf(await resolvePicks({ picksPath }))

describe('TOOL_NAMES', () => {
  it('is the set the instructions promise', () => {
    expect(TOOL_NAMES).toEqual(['list_picks', 'get_pick', 'resolve_picks'])
  })
})

describe('pickId', () => {
  it('takes a number and a numeric string', () => {
    expect(pickId.parse(2)).toBe(2)
    expect(pickId.parse('2')).toBe(2)
  })

  it('refuses what z.coerce.number() would quietly accept', () => {
    // `true` would coerce to 1 and `null` to 0 — both real picks.
    for (const value of [true, null, 1.5, 'two', '', {}, -1, 0]) {
      expect(pickId.safeParse(value).success).toBe(false)
    }
  })
})

describe('listPicks', () => {
  it('lists what is on file', async () => {
    await writePicksFixture(root)
    const body = await list()
    expect(body).toContain('3 picks:')
    expect(body).toContain('PICK 2')
    expect(body).toContain(picksPath)
  })

  it('says the file is not there yet, rather than pretending it is empty', async () => {
    const body = await list()
    expect(body).toContain('not created yet')
    expect(body).toContain('No picks yet')
  })

  it('distinguishes an empty file from a missing one', async () => {
    await writePicksFixture(root, [])
    const body = await list()
    expect(body).not.toContain('not created yet')
    expect(body).toContain('No picks yet')
  })

  it('reports when the picks were written, not when they were read', async () => {
    await writePicksFixture(root)
    const body = await list()
    // `readPicks` restamps `updatedAt` to now, so a correct header can only come
    // from the file's mtime.
    const stamp = body.match(/updated (\S+)/)?.[1] ?? ''
    // Within a second of now either way: an mtime carries sub-millisecond
    // precision that the ISO string rounds, so it can land a tick in the future.
    expect(Math.abs(Date.parse(stamp) - Date.now())).toBeLessThan(1000)
    // And it does not move when the file is only read.
    await new Promise((settle) => setTimeout(settle, 5))
    expect(await list()).toContain(stamp)
  })

  it('filters to one page', async () => {
    await writePicksFixture(root)
    const body = await list({ page: '/settings' })
    expect(body).toContain('PICK 2')
    expect(body).not.toContain('PICK 1')
  })

  it('filters to the picks that carry a note', async () => {
    await writePicksFixture(root)
    expect(await list({ withNotes: true })).toContain('1 pick with a note:')
  })

  it('says what it looked for when a filter matched nothing', async () => {
    await writePicksFixture(root, [buyButton])
    expect(await list({ withNotes: true })).toContain('No picks with a note.')
    expect(await list({ page: '/nope' })).toContain('pages matching "/nope"')
  })

  it('expands every field on request', async () => {
    await writePicksFixture(root)
    expect(await list({ detail: 'full' })).toContain('dom path')
  })

  it('re-reads the file on every call, because the user goes on picking', async () => {
    await writePicksFixture(root, [buyButton])
    expect(await list()).toContain('1 pick:')
    await writePicksFixture(root, allPicks)
    expect(await list()).toContain('3 picks:')
  })

  it('drops a malformed pick instead of failing the call', async () => {
    await writeFile(
      picksPath,
      JSON.stringify({ version: 1, picks: [buyButton, { nope: true }, null] }),
      'utf8',
    )
    expect(await list()).toContain('1 pick:')
  })

  it('survives a picks file that is not JSON at all', async () => {
    await writeFile(picksPath, 'not json', 'utf8')
    expect(await list()).toContain('No picks yet')
  })
})

describe('getPick', () => {
  it('returns every field of the pick asked for', async () => {
    await writePicksFixture(root)
    const body = textOf(await single(1))
    expect(body).toContain('PICK 1 — Buy now')
    expect(body).toContain('src/components/BuyButton.vue:12')
    expect(body).toContain('dom path')
  })

  it('reports a missing pick as an error the agent can act on, listing what exists', async () => {
    await writePicksFixture(root)
    const result = await single(99)
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('no PICK 99')
    expect(textOf(result)).toContain('1, 2, 3')
  })

  it('explains how to make a pick when there are none yet', async () => {
    const result = await single(1)
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('Alt+Q')
  })

  it('marks a found pick as not an error', async () => {
    await writePicksFixture(root)
    expect((await single(1)).isError).toBeUndefined()
  })
})

describe('resolvePicks', () => {
  it('returns the noted picks as a numbered plan', async () => {
    await writePicksFixture(root)
    const body = await resolve()
    expect(body).toContain('1 pick to resolve, in order:')
    expect(body).toContain('1. PICK 2 —')
    expect(body).toContain('make this sticky on scroll')
  })

  it('tells the agent to leave the picks file alone', async () => {
    await writePicksFixture(root)
    expect(await resolve()).toContain('Do not edit the picks file')
  })

  it('says there is nothing to resolve when no pick carries a note', async () => {
    await writePicksFixture(root, [buyButton])
    expect(await resolve()).toContain('carries a note')
  })
})
