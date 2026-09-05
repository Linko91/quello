import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import type { QuelloPick, QuelloPicksFile } from '@quello/core'
import {
  listPickResources,
  PICK_URI_TEMPLATE,
  PICKS_URI,
  pickResource,
  picksResource,
  readPickResource,
  readPicksResource,
} from '../src/resources'
import { sidebar, writePicksFixture } from './fixtures'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-resources-'))
  picksPath = join(root, '.quello', 'picks.json')
})

const context = () => ({ picksPath })
const bodyOf = (contents: { contents: Array<{ text?: unknown }> }) =>
  JSON.parse(String(contents.contents[0]?.text))

describe('the declarations', () => {
  it('publishes the picks file under a quello:// uri', () => {
    expect(picksResource.uri).toBe('quello://picks')
    expect(picksResource.config.mimeType).toBe('application/json')
  })

  it('publishes a template for one pick at a time', () => {
    expect(pickResource.template).toBe('quello://picks/{id}')
  })

  it('describes both, since the description is all a client shows', () => {
    for (const entry of [picksResource.config, pickResource.config]) {
      expect(entry.title).toBeTruthy()
      expect(entry.description).toBeTruthy()
    }
  })
})

describe('readPicksResource', () => {
  it('hands back the picks file verbatim, so the file format still applies', async () => {
    await writePicksFixture(root)
    const contents = await readPicksResource(PICKS_URI, context())
    expect(contents.contents[0]).toMatchObject({
      uri: PICKS_URI,
      mimeType: 'application/json',
    })
    const parsed = bodyOf(contents) as QuelloPicksFile
    expect(parsed.version).toBe(1)
    expect(parsed.picks.map((pick) => pick.id)).toEqual([1, 2, 3])
  })

  it('answers with an empty file before the first pick', async () => {
    expect((bodyOf(await readPicksResource(PICKS_URI, context())) as QuelloPicksFile).picks).toEqual(
      [],
    )
  })
})

describe('readPickResource', () => {
  it('hands back one pick as raw JSON', async () => {
    await writePicksFixture(root)
    const contents = await readPickResource('quello://picks/2', '2', context())
    expect(bodyOf(contents) as QuelloPick).toEqual(sidebar)
  })

  it('refuses a pick that is not there', async () => {
    await writePicksFixture(root)
    await expect(readPickResource('quello://picks/99', '99', context())).rejects.toThrow(
      'No PICK 99 on file',
    )
  })

  it('refuses an id that is not a number', async () => {
    await writePicksFixture(root)
    for (const id of ['abc', '', '2.5', '-1']) {
      await expect(readPickResource(`quello://picks/${id}`, id, context())).rejects.toThrow(
        'not a pick number',
      )
    }
  })
})

describe('listPickResources', () => {
  it('enumerates the picks that exist right now', async () => {
    await writePicksFixture(root)
    const { resources } = await listPickResources(context())
    expect(resources.map((resource) => resource.uri)).toEqual([
      'quello://picks/1',
      'quello://picks/2',
      'quello://picks/3',
    ])
  })

  it('names each one the way the user does, and summarises it', async () => {
    await writePicksFixture(root)
    const { resources } = await listPickResources(context())
    const second = resources[1]
    expect(second?.name).toBe('PICK 2')
    expect(second?.description).toContain('make this sticky on scroll')
    expect(second?.mimeType).toBe('application/json')
  })

  it('is empty before the first pick, rather than failing', async () => {
    expect((await listPickResources(context())).resources).toEqual([])
  })
})

describe('the uri template', () => {
  it('is the one the read handler answers for', () => {
    expect(PICK_URI_TEMPLATE.startsWith(PICKS_URI)).toBe(true)
  })
})
