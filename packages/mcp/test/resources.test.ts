import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import type { QuelloPick, QuelloPicksFile } from '@quello/core'
import {
  PICK_URI_TEMPLATE,
  PICKS_URI,
  pickIdFromUri,
  readResource,
  RESOURCE_TEMPLATES,
  RESOURCES,
} from '../src/resources'
import { RESOURCE_NOT_FOUND, RpcError } from '../src/protocol'
import { sidebar, writePicksFixture } from './fixtures'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-resources-'))
  picksPath = join(root, '.quello', 'picks.json')
})

const read = (uri: string) => readResource(uri, { picksPath })

describe('RESOURCES', () => {
  it('publishes the picks file under a quello:// uri', () => {
    expect(RESOURCES).toHaveLength(1)
    expect(RESOURCES[0]).toMatchObject({ uri: 'quello://picks', mimeType: 'application/json' })
  })

  it('publishes a template for one pick at a time', () => {
    expect(RESOURCE_TEMPLATES[0]?.uriTemplate).toBe('quello://picks/{id}')
  })

  it('describes both, since the description is all a client shows', () => {
    for (const entry of [...RESOURCES, ...RESOURCE_TEMPLATES]) {
      expect(entry.title).toBeTruthy()
      expect(entry.description).toBeTruthy()
    }
  })
})

describe('pickIdFromUri', () => {
  it('reads the number off a pick uri', () => {
    expect(pickIdFromUri('quello://picks/2')).toBe(2)
    expect(pickIdFromUri('quello://picks/40')).toBe(40)
  })

  it('is null for the collection itself', () => {
    expect(pickIdFromUri(PICKS_URI)).toBe(null)
  })

  it('is null for anything that is not a number', () => {
    for (const uri of [
      'quello://picks/abc',
      'quello://picks/',
      'quello://picks/2/extra',
      'quello://other/2',
      'file:///etc/passwd',
      PICK_URI_TEMPLATE,
    ]) {
      expect(pickIdFromUri(uri)).toBe(null)
    }
  })
})

describe('readResource', () => {
  it('hands back the picks file verbatim, so the file format still applies', async () => {
    await writePicksFixture(root)
    const contents = await read(PICKS_URI)
    expect(contents.contents[0]).toMatchObject({ uri: PICKS_URI, mimeType: 'application/json' })
    const parsed = JSON.parse(contents.contents[0]?.text ?? '') as QuelloPicksFile
    expect(parsed.version).toBe(1)
    expect(parsed.picks.map((pick) => pick.id)).toEqual([1, 2, 3])
  })

  it('hands back one pick as raw JSON', async () => {
    await writePicksFixture(root)
    const contents = await read('quello://picks/2')
    const parsed = JSON.parse(contents.contents[0]?.text ?? '') as QuelloPick
    expect(parsed).toEqual(sidebar)
  })

  it('answers the collection with an empty file before the first pick', async () => {
    const parsed = JSON.parse((await read(PICKS_URI)).contents[0]?.text ?? '') as QuelloPicksFile
    expect(parsed.picks).toEqual([])
  })

  it('refuses a pick that is not there, with the code MCP reserves', async () => {
    await writePicksFixture(root)
    await expect(read('quello://picks/99')).rejects.toMatchObject({
      code: RESOURCE_NOT_FOUND,
      message: 'No PICK 99 on file',
    })
  })

  it('refuses a uri it does not serve, and says what it does serve', async () => {
    const error = await read('quello://nope').catch((thrown: unknown) => thrown)
    expect(error).toBeInstanceOf(RpcError)
    expect((error as RpcError).code).toBe(RESOURCE_NOT_FOUND)
    expect((error as RpcError).data).toMatchObject({ available: [PICKS_URI, PICK_URI_TEMPLATE] })
  })

  it('does not read a file path handed to it as a uri', async () => {
    await expect(read('file:///etc/passwd')).rejects.toThrow('Unknown resource')
  })
})
