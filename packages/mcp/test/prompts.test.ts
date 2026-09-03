import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { getPrompt, PROMPTS } from '../src/prompts'
import { buyButton, writePicksFixture } from './fixtures'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-prompts-'))
  picksPath = join(root, '.quello', 'picks.json')
})

const get = (name: string, args?: Record<string, unknown>) => getPrompt(name, args, { picksPath })

const textOf = async (name: string, args?: Record<string, unknown>) => {
  const prompt = await get(name, args)
  return prompt.messages[0]?.content.text ?? ''
}

describe('PROMPTS', () => {
  it('offers the two the user would reach for', () => {
    expect(PROMPTS.map((prompt) => prompt.name)).toEqual(['resolve-picks', 'explain-pick'])
  })

  it('describes each one, since that is what a slash-command menu shows', () => {
    for (const prompt of PROMPTS) {
      expect(prompt.title).toBeTruthy()
      expect(prompt.description).toBeTruthy()
    }
  })

  it('declares the id argument as required', () => {
    const explain = PROMPTS.find((prompt) => prompt.name === 'explain-pick')
    expect(explain?.arguments).toEqual([
      { name: 'id', description: 'The pick number, i.e. 2 for PICK 2.', required: true },
    ])
  })
})

describe('resolve-picks', () => {
  it('comes back with the work list already in it, not with instructions to fetch it', async () => {
    await writePicksFixture(root)
    const text = await textOf('resolve-picks')
    expect(text).toContain('1 pick to resolve, in order:')
    expect(text).toContain('make this sticky on scroll')
  })

  it('is phrased as the user speaking, since that is the role it carries', async () => {
    await writePicksFixture(root)
    const prompt = await get('resolve-picks')
    expect(prompt.messages[0]?.role).toBe('user')
    expect(prompt.messages[0]?.content.text).toContain('I picked')
  })

  it('still returns a usable prompt when there is nothing to resolve', async () => {
    expect(await textOf('resolve-picks')).toContain('nothing to resolve')
  })

  it('takes no arguments', async () => {
    await writePicksFixture(root)
    await expect(get('resolve-picks', { id: 1 })).resolves.toBeTruthy()
  })
})

describe('explain-pick', () => {
  it('embeds the pick it was asked about', async () => {
    await writePicksFixture(root)
    const text = await textOf('explain-pick', { id: 1 })
    expect(text).toContain('Find PICK 1 in the codebase')
    expect(text).toContain('src/components/BuyButton.vue:12')
  })

  it('accepts the id as a string, which is how a client passes prompt arguments', async () => {
    await writePicksFixture(root)
    expect(await textOf('explain-pick', { id: '2' })).toContain('PICK 2')
  })

  it('names the pick in its description', async () => {
    await writePicksFixture(root)
    expect((await get('explain-pick', { id: 1 })).description).toBe('Explain PICK 1.')
  })

  it('refuses an id that is not on file', async () => {
    await writePicksFixture(root, [buyButton])
    await expect(get('explain-pick', { id: 9 })).rejects.toThrow('There is no PICK 9 on file')
  })

  it('refuses a missing or unreadable id', async () => {
    await writePicksFixture(root)
    await expect(get('explain-pick')).rejects.toThrow('id must be an integer')
    await expect(get('explain-pick', { id: 'two' })).rejects.toThrow('id must be an integer')
  })
})

describe('an unknown prompt', () => {
  it('names the real ones', async () => {
    await expect(get('nope')).rejects.toThrow(
      'Unknown prompt "nope". Available: resolve-picks, explain-pick.',
    )
  })
})
