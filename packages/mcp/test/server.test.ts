import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SERVER_INSTRUCTIONS, SERVER_VERSION } from '../src/server'
import { PICK_URI_TEMPLATE, PICKS_URI } from '../src/resources'
import { connect, textOf } from './client'
import { buyButton, writePicksFixture } from './fixtures'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-server-'))
  picksPath = join(root, '.quello', 'picks.json')
})

const client = () => connect({ picksPath })

describe('the handshake', () => {
  it('reports its name and version', async () => {
    expect((await client()).getServerVersion()).toMatchObject({
      name: 'quello',
      version: SERVER_VERSION,
    })
  })

  it('hands the agent the instructions on connect', async () => {
    expect((await client()).getInstructions()).toBe(SERVER_INSTRUCTIONS)
  })

  it('takes the name and version it was built with', async () => {
    const named = await connect({ picksPath, name: 'other', version: '9.9.9' })
    expect(named.getServerVersion()).toMatchObject({ name: 'other', version: '9.9.9' })
  })

  it('answers a ping', async () => {
    await expect((await client()).ping()).resolves.toBeDefined()
  })
})

describe('tools/list', () => {
  it('offers exactly the three ways in', async () => {
    const { tools } = await (await client()).listTools()
    expect(tools.map((tool) => tool.name)).toEqual(['list_picks', 'get_pick', 'resolve_picks'])
  })

  it('declares every tool read-only, because picks belong to the toolbar', async () => {
    const { tools } = await (await client()).listTools()
    for (const tool of tools) {
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false })
    }
  })

  it('gives every tool a title, a description and an object schema', async () => {
    const { tools } = await (await client()).listTools()
    for (const tool of tools) {
      expect(tool.title).toBeTruthy()
      expect((tool.description ?? '').length).toBeGreaterThan(40)
      expect(tool.inputSchema.type).toBe('object')
    }
  })

  it('publishes the argument schema the SDK built from the zod shapes', async () => {
    const { tools } = await (await client()).listTools()
    const listed = tools.find((tool) => tool.name === 'list_picks')
    const properties = listed?.inputSchema.properties as Record<string, { description?: string }>
    expect(Object.keys(properties)).toEqual(['detail', 'page', 'withNotes'])
    // The `.describe()` calls reach the client, which is the whole point of them.
    expect(properties.detail?.description).toContain('one line per pick')

    const single = tools.find((tool) => tool.name === 'get_pick')
    expect(single?.inputSchema.required).toEqual(['id'])
  })

  it('teaches the agent the vocabulary the user will use', async () => {
    const { tools } = await (await client()).listTools()
    const listed = tools.find((tool) => tool.name === 'list_picks')
    expect(listed?.description).toContain('PICK')
    expect(listed?.description).toContain('quello')
  })

  it('has no write tool to find, by design', async () => {
    const { tools } = await (await client()).listTools()
    const names = tools.map((tool) => tool.name).join(' ')
    for (const verb of ['clear', 'delete', 'write', 'set_note', 'update']) {
      expect(names).not.toContain(verb)
    }
  })
})

describe('tools/call', () => {
  it('runs a tool and returns its text', async () => {
    await writePicksFixture(root)
    const result = await (await client()).callTool({ name: 'list_picks', arguments: {} })
    expect(textOf(result)).toContain('3 picks:')
  })

  it('applies the filters', async () => {
    await writePicksFixture(root)
    const connected = await client()
    expect(
      textOf(await connected.callTool({ name: 'list_picks', arguments: { withNotes: true } })),
    ).toContain('1 pick with a note:')
    expect(
      textOf(await connected.callTool({ name: 'list_picks', arguments: { page: '/settings' } })),
    ).not.toContain('PICK 1')
  })

  it('runs a tool that takes no arguments', async () => {
    await writePicksFixture(root)
    const result = await (await client()).callTool({ name: 'resolve_picks', arguments: {} })
    expect(textOf(result)).toContain('1 pick to resolve, in order:')
  })

  it('returns one pick in full', async () => {
    await writePicksFixture(root)
    const result = await (await client()).callTool({ name: 'get_pick', arguments: { id: 2 } })
    expect(textOf(result)).toContain('make this sticky on scroll')
  })

  it('takes an id given as a string, which agents do', async () => {
    await writePicksFixture(root)
    const result = await (await client()).callTool({ name: 'get_pick', arguments: { id: '2' } })
    expect(result.isError).toBeFalsy()
    expect(textOf(result)).toContain('PICK 2')
  })

  it('reports a missing pick in the result, for the agent to react to', async () => {
    await writePicksFixture(root)
    const result = await (await client()).callTool({ name: 'get_pick', arguments: { id: 99 } })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('Picks currently on file: 1, 2, 3')
  })

  it('refuses arguments the schema rejects', async () => {
    await writePicksFixture(root)
    const connected = await client()
    for (const args of [{ id: 'two' }, { id: true }, { id: 1.5 }, {}]) {
      const result = await connected.callTool({ name: 'get_pick', arguments: args })
      expect(result.isError).toBe(true)
      expect(textOf(result)).toContain('Invalid arguments for tool get_pick')
    }
  })

  it('refuses an out-of-range detail rather than guessing', async () => {
    const result = await (await client()).callTool({
      name: 'list_picks',
      arguments: { detail: 'verbose' },
    })
    expect(result.isError).toBe(true)
  })

  it('reports an unknown tool in the result, the way the SDK reports every tool failure', async () => {
    const result = await (await client()).callTool({ name: 'delete_picks', arguments: {} })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('delete_picks')
  })

  it('invokes a zero-argument tool with no arguments key at all', async () => {
    await writePicksFixture(root)
    const result = await (await client()).callTool({ name: 'resolve_picks' })
    expect(result.isError).toBeFalsy()
    expect(textOf(result)).toContain('to resolve')
  })

  it('re-reads the file on every call, because the user goes on picking', async () => {
    await writePicksFixture(root, [buyButton])
    const connected = await client()
    expect(textOf(await connected.callTool({ name: 'list_picks', arguments: {} }))).toContain(
      '1 pick:',
    )
    await writePicksFixture(root)
    expect(textOf(await connected.callTool({ name: 'list_picks', arguments: {} }))).toContain(
      '3 picks:',
    )
  })
})

describe('resources', () => {
  it('publishes the picks file and a template for one pick', async () => {
    const connected = await client()
    const { resources } = await connected.listResources()
    expect(resources.map((resource) => resource.uri)).toContain(PICKS_URI)

    const { resourceTemplates } = await connected.listResourceTemplates()
    expect(resourceTemplates.map((template) => template.uriTemplate)).toContain(PICK_URI_TEMPLATE)
  })

  it('enumerates the picks that exist, not just the template', async () => {
    await writePicksFixture(root)
    const { resources } = await (await client()).listResources()
    expect(resources.map((resource) => resource.uri)).toEqual(
      expect.arrayContaining(['quello://picks/1', 'quello://picks/2', 'quello://picks/3']),
    )
    expect(resources.find((resource) => resource.uri === 'quello://picks/2')?.description).toContain(
      'make this sticky',
    )
  })

  it('reads the whole file back as the raw payload', async () => {
    await writePicksFixture(root)
    const { contents } = await (await client()).readResource({ uri: PICKS_URI })
    expect(contents[0]).toMatchObject({ uri: PICKS_URI, mimeType: 'application/json' })
    const parsed = JSON.parse(String(contents[0]?.text)) as { picks: Array<{ id: number }> }
    expect(parsed.picks.map((pick) => pick.id)).toEqual([1, 2, 3])
  })

  it('reads one pick through the uri template', async () => {
    await writePicksFixture(root)
    const { contents } = await (await client()).readResource({ uri: 'quello://picks/2' })
    const parsed = JSON.parse(String(contents[0]?.text)) as { id: number; note: string }
    expect(parsed).toMatchObject({ id: 2, note: 'make this sticky on scroll' })
  })

  it('refuses a pick that is not there', async () => {
    await writePicksFixture(root)
    await expect((await client()).readResource({ uri: 'quello://picks/99' })).rejects.toThrow(
      /No PICK 99/,
    )
  })

  it('refuses a uri it does not serve', async () => {
    const connected = await client()
    for (const uri of ['quello://nope', 'file:///etc/passwd']) {
      await expect(connected.readResource({ uri })).rejects.toThrow()
    }
  })
})

describe('prompts', () => {
  it('offers the two the user would reach for', async () => {
    const { prompts } = await (await client()).listPrompts()
    expect(prompts.map((prompt) => prompt.name)).toEqual(['resolve-picks', 'explain-pick'])
  })

  it('describes each one, since that is what a slash-command menu shows', async () => {
    const { prompts } = await (await client()).listPrompts()
    for (const prompt of prompts) {
      expect(prompt.title).toBeTruthy()
      expect(prompt.description).toBeTruthy()
    }
  })

  it('declares the id argument as required', async () => {
    const { prompts } = await (await client()).listPrompts()
    const explain = prompts.find((prompt) => prompt.name === 'explain-pick')
    expect(explain?.arguments).toEqual([
      expect.objectContaining({ name: 'id', required: true }),
    ])
  })

  it('returns the work list already filled in', async () => {
    await writePicksFixture(root)
    const prompt = await (await client()).getPrompt({ name: 'resolve-picks' })
    expect(prompt.messages[0]?.role).toBe('user')
    expect(String(prompt.messages[0]?.content.text)).toContain('make this sticky on scroll')
  })

  it('returns one pick, embedded', async () => {
    await writePicksFixture(root)
    const prompt = await (await client()).getPrompt({
      name: 'explain-pick',
      arguments: { id: '1' },
    })
    expect(String(prompt.messages[0]?.content.text)).toContain('src/components/BuyButton.vue:12')
  })

  it('refuses an id that is not on file, and one that is not a number', async () => {
    await writePicksFixture(root)
    const connected = await client()
    await expect(
      connected.getPrompt({ name: 'explain-pick', arguments: { id: '99' } }),
    ).rejects.toThrow(/no PICK 99/)
    await expect(
      connected.getPrompt({ name: 'explain-pick', arguments: { id: 'two' } }),
    ).rejects.toThrow()
  })

  it('rejects an unknown prompt', async () => {
    await expect((await client()).getPrompt({ name: 'nope' })).rejects.toThrow(/nope/)
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
