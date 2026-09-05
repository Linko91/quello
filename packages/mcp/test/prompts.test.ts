import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  explainPickPrompt,
  explainPickPromptHandler,
  resolvePicksPrompt,
  resolvePicksPromptHandler,
} from '../src/prompts'
import { buyButton, writePicksFixture } from './fixtures'

let root = ''
let picksPath = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-prompts-'))
  picksPath = join(root, '.quello', 'picks.json')
})

const context = () => ({ picksPath })
const textOf = (prompt: { messages: Array<{ content: { text?: unknown } }> }) =>
  String(prompt.messages[0]?.content.text ?? '')

describe('the declarations', () => {
  it('describes each one, since that is what a slash-command menu shows', () => {
    for (const prompt of [resolvePicksPrompt, explainPickPrompt]) {
      expect(prompt.config.title).toBeTruthy()
      expect(prompt.config.description).toBeTruthy()
    }
  })

  it('takes the pick number as a string, which is how prompt arguments travel', () => {
    const id = explainPickPrompt.config.argsSchema.id
    expect(id.safeParse('2').success).toBe(true)
    expect(id.safeParse('two').success).toBe(false)
    expect(id.safeParse('').success).toBe(false)
  })

  it('declares no argument schema on resolve-picks, not an empty one', () => {
    // An empty schema is still a schema: the SDK would validate `arguments`
    // against it and reject a client that omitted them, which is the normal way
    // to invoke a prompt that takes none.
    expect('argsSchema' in resolvePicksPrompt.config).toBe(false)
  })
})

describe('resolve-picks', () => {
  it('comes back with the work list already in it, not with instructions to fetch it', async () => {
    await writePicksFixture(root)
    const text = textOf(await resolvePicksPromptHandler(context()))
    expect(text).toContain('1 pick to resolve, in order:')
    expect(text).toContain('make this sticky on scroll')
  })

  it('is phrased as the user speaking, since that is the role it carries', async () => {
    await writePicksFixture(root)
    const prompt = await resolvePicksPromptHandler(context())
    expect(prompt.messages[0]?.role).toBe('user')
    expect(textOf(prompt)).toContain('I picked')
  })

  it('still returns a usable prompt when there is nothing to resolve', async () => {
    expect(textOf(await resolvePicksPromptHandler(context()))).toContain('nothing to resolve')
  })
})

describe('explain-pick', () => {
  it('embeds the pick it was asked about', async () => {
    await writePicksFixture(root)
    const text = textOf(await explainPickPromptHandler({ id: '1' }, context()))
    expect(text).toContain('Find PICK 1 in the codebase')
    expect(text).toContain('src/components/BuyButton.vue:12')
  })

  it('names the pick in its description', async () => {
    await writePicksFixture(root)
    expect((await explainPickPromptHandler({ id: '1' }, context())).description).toBe(
      'Explain PICK 1.',
    )
  })

  it('refuses an id that is not on file', async () => {
    await writePicksFixture(root, [buyButton])
    await expect(explainPickPromptHandler({ id: '9' }, context())).rejects.toThrow(
      'There is no PICK 9 on file',
    )
  })
})
