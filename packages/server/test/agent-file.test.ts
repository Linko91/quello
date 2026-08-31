import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_AGENT_FILE, ensureAgentFile, section } from '../src/agent-file'

let root = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-agent-'))
})

const read = (file: string) => readFile(join(root, file), 'utf8')

describe('ensureAgentFile', () => {
  it('creates AGENTS.md by default', async () => {
    expect(await ensureAgentFile(root, { picksFile: '.quello/picks.json' })).toBe('created')
    const written = await read(DEFAULT_AGENT_FILE)
    expect(DEFAULT_AGENT_FILE).toBe('AGENTS.md')
    expect(written).toContain('<!-- quello:start -->')
    expect(written).toContain('.quello/picks.json')
  })

  it('writes whichever file it is given', async () => {
    await ensureAgentFile(root, { file: 'CLAUDE.md', picksFile: '.quello/picks.json' })
    expect(await read('CLAUDE.md')).toContain('quello — visual element picks')
  })

  it('creates the directory when the file lives in one', async () => {
    await ensureAgentFile(root, {
      file: '.github/copilot-instructions.md',
      picksFile: '.quello/picks.json',
    })
    expect(await read('.github/copilot-instructions.md')).toContain('<!-- quello:end -->')
  })

  it('appends to a file that already exists, keeping what was there', async () => {
    await writeFile(join(root, 'AGENTS.md'), '# House rules\n\nUse tabs.\n', 'utf8')
    expect(await ensureAgentFile(root, { picksFile: '.quello/picks.json' })).toBe('appended')
    const written = await read('AGENTS.md')
    expect(written).toContain('Use tabs.')
    expect(written).toContain('<!-- quello:start -->')
  })

  it('leaves an existing quello section alone, so edits to it survive', async () => {
    await ensureAgentFile(root, { picksFile: '.quello/picks.json' })
    const before = await read('AGENTS.md')
    expect(await ensureAgentFile(root, { picksFile: '.quello/picks.json' })).toBe('skipped')
    expect(await read('AGENTS.md')).toBe(before)
  })

  it('separates cleanly from a file with no trailing newline', async () => {
    await writeFile(join(root, 'AGENTS.md'), '# House rules', 'utf8')
    await ensureAgentFile(root, { picksFile: '.quello/picks.json' })
    expect(await read('AGENTS.md')).toContain('# House rules\n\n<!-- quello:start -->')
  })

  it('names the picks file it was told about', async () => {
    await ensureAgentFile(root, { file: 'AGENTS.md', picksFile: 'tmp/other.json' })
    const written = await read('AGENTS.md')
    expect(written).toContain('tmp/other.json')
    expect(written).not.toContain('.quello/picks.json')
  })

  it('writes both files independently when asked for both', async () => {
    await mkdir(join(root, 'nested'), { recursive: true })
    await ensureAgentFile(root, { file: 'AGENTS.md', picksFile: '.quello/picks.json' })
    await ensureAgentFile(root, { file: 'CLAUDE.md', picksFile: '.quello/picks.json' })
    expect(await read('AGENTS.md')).toContain('quello:start')
    expect(await read('CLAUDE.md')).toContain('quello:start')
  })
})

describe('section', () => {
  it('is fenced so it can be found and left alone', () => {
    const text = section('.quello/picks.json')
    expect(text.startsWith('<!-- quello:start -->')).toBe(true)
    expect(text.endsWith('<!-- quello:end -->')).toBe(true)
  })

  it('tells the agent what resolving the picks means', () => {
    expect(section('.quello/picks.json')).toContain('Resolve the picks')
  })
})
