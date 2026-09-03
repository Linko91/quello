import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { callTool, TOOLS } from '../src/tools'
import { RpcError } from '../src/protocol'
import { allPicks, buyButton, sidebar, writePicksFixture } from './fixtures'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-tools-'))
  picksPath = join(root, '.quello', 'picks.json')
  // The directory exists but the file does not, which is the state a project is
  // in between installing quello and making the first pick.
  await mkdir(join(root, '.quello'), { recursive: true })
})

const call = async (name: string, args?: Record<string, unknown>) =>
  callTool(name, args, { picksPath })

const bodyOf = async (name: string, args?: Record<string, unknown>) => {
  const result = await call(name, args)
  return result.content[0]?.text ?? ''
}

describe('TOOLS', () => {
  it('offers exactly the three ways in', () => {
    expect(TOOLS.map((tool) => tool.name)).toEqual(['list_picks', 'get_pick', 'resolve_picks'])
  })

  it('declares every tool read-only, because picks belong to the toolbar', () => {
    for (const tool of TOOLS) {
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false })
    }
  })

  it('gives every tool a title, a description and an object schema', () => {
    for (const tool of TOOLS) {
      expect(tool.title).toBeTruthy()
      expect(tool.description.length).toBeGreaterThan(40)
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.inputSchema.additionalProperties).toBe(false)
    }
  })

  it('teaches the agent the vocabulary the user will use', () => {
    const listed = TOOLS.find((tool) => tool.name === 'list_picks')
    expect(listed?.description).toContain('PICK')
    expect(listed?.description).toContain('quello')
  })

  it('requires an id on get_pick and nothing on resolve_picks', () => {
    expect(TOOLS.find((tool) => tool.name === 'get_pick')?.inputSchema.required).toEqual(['id'])
    expect(TOOLS.find((tool) => tool.name === 'resolve_picks')?.inputSchema.required).toBeUndefined()
  })
})

describe('list_picks', () => {
  it('lists what is on file', async () => {
    await writePicksFixture(root)
    const body = await bodyOf('list_picks')
    expect(body).toContain('3 picks:')
    expect(body).toContain('PICK 2')
    expect(body).toContain(picksPath)
  })

  it('says the file is not there yet, rather than pretending it is empty', async () => {
    const body = await bodyOf('list_picks')
    expect(body).toContain('not created yet')
    expect(body).toContain('No picks yet')
  })

  it('distinguishes an empty file from a missing one', async () => {
    await writePicksFixture(root, [])
    const body = await bodyOf('list_picks')
    expect(body).not.toContain('not created yet')
    expect(body).toContain('No picks yet')
  })

  it('reports when the picks were written, not when they were read', async () => {
    await writePicksFixture(root)
    const body = await bodyOf('list_picks')
    // `readPicks` restamps `updatedAt` to now, so a correct header can only come
    // from the file's mtime.
    const stamp = body.match(/updated (\S+)/)?.[1] ?? ''
    expect(Date.parse(stamp)).toBeLessThanOrEqual(Date.now())
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(await bodyOf('list_picks')).toContain(stamp)
  })

  it('filters to one page', async () => {
    await writePicksFixture(root)
    const body = await bodyOf('list_picks', { page: '/settings' })
    expect(body).toContain('PICK 2')
    expect(body).not.toContain('PICK 1')
  })

  it('filters to the picks that carry a note', async () => {
    await writePicksFixture(root)
    const body = await bodyOf('list_picks', { withNotes: true })
    expect(body).toContain('1 pick with a note:')
  })

  it('says what it looked for when a filter matched nothing', async () => {
    await writePicksFixture(root, [buyButton])
    expect(await bodyOf('list_picks', { withNotes: true })).toContain('No picks with a note.')
    expect(await bodyOf('list_picks', { page: '/nope' })).toContain('pages matching "/nope"')
  })

  it('expands every field on request', async () => {
    await writePicksFixture(root)
    expect(await bodyOf('list_picks', { detail: 'full' })).toContain('dom path')
  })

  it('re-reads the file on every call, because the user goes on picking', async () => {
    await writePicksFixture(root, [buyButton])
    expect(await bodyOf('list_picks')).toContain('1 pick:')
    await writePicksFixture(root, allPicks)
    expect(await bodyOf('list_picks')).toContain('3 picks:')
  })

  it('drops a malformed pick instead of failing the call', async () => {
    await writeFile(
      picksPath,
      JSON.stringify({ version: 1, picks: [buyButton, { nope: true }, null] }),
      'utf8',
    )
    expect(await bodyOf('list_picks')).toContain('1 pick:')
  })

  it('survives a picks file that is not JSON at all', async () => {
    await writeFile(picksPath, 'not json', 'utf8')
    expect(await bodyOf('list_picks')).toContain('No picks yet')
  })

  it('refuses arguments of the wrong type, as a protocol error', async () => {
    await expect(call('list_picks', { page: 7 })).rejects.toThrow(RpcError)
    await expect(call('list_picks', { withNotes: 'yes' })).rejects.toThrow('must be a boolean')
    await expect(call('list_picks', { detail: 'verbose' })).rejects.toThrow(
      'must be one of summary, full',
    )
  })
})

describe('get_pick', () => {
  it('returns every field of the pick asked for', async () => {
    await writePicksFixture(root)
    const body = await bodyOf('get_pick', { id: 1 })
    expect(body).toContain('PICK 1 — Buy now')
    expect(body).toContain('src/components/BuyButton.vue:12')
    expect(body).toContain('dom path')
  })

  it('accepts an id handed over as a string, which agents do', async () => {
    await writePicksFixture(root)
    expect(await bodyOf('get_pick', { id: '2' })).toContain('PICK 2')
  })

  it('reports a missing pick as an error the agent can act on, listing what exists', async () => {
    await writePicksFixture(root)
    const result = await call('get_pick', { id: 99 })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('no PICK 99')
    expect(result.content[0]?.text).toContain('1, 2, 3')
  })

  it('explains how to make a pick when there are none yet', async () => {
    const result = await call('get_pick', { id: 1 })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('Alt+Q')
  })

  it('refuses an id that is not an integer', async () => {
    for (const id of [undefined, 'two', 1.5, {}, null]) {
      await expect(call('get_pick', { id })).rejects.toThrow('id must be an integer')
    }
  })
})

describe('resolve_picks', () => {
  it('returns the noted picks as a numbered plan', async () => {
    await writePicksFixture(root)
    const body = await bodyOf('resolve_picks')
    expect(body).toContain('1 pick to resolve, in order:')
    expect(body).toContain('1. PICK 2 —')
    expect(body).toContain('make this sticky on scroll')
  })

  it('tells the agent to leave the picks file alone', async () => {
    await writePicksFixture(root)
    expect(await bodyOf('resolve_picks')).toContain('Do not edit the picks file')
  })

  it('says there is nothing to resolve when no pick carries a note', async () => {
    await writePicksFixture(root, [buyButton])
    expect(await bodyOf('resolve_picks')).toContain('carries a note')
  })

  it('ignores arguments it was not expecting', async () => {
    await writePicksFixture(root, [sidebar])
    expect(await bodyOf('resolve_picks', { extra: true })).toContain('1 pick to resolve')
  })
})

describe('an unknown tool', () => {
  it('comes back as a protocol error that names the real ones', async () => {
    await expect(call('delete_picks')).rejects.toThrow(
      'Unknown tool "delete_picks". Available: list_picks, get_pick, resolve_picks.',
    )
  })

  it('has no write tool to find, by design', () => {
    const names = TOOLS.map((tool) => tool.name).join(' ')
    for (const verb of ['clear', 'delete', 'write', 'set_note', 'update']) {
      expect(names).not.toContain(verb)
    }
  })
})
