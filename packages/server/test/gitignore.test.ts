import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { alreadyIgnored, ensureGitignored, ignorePattern } from '../src/gitignore'

let root = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-gitignore-'))
})

const read = () => readFile(join(root, '.gitignore'), 'utf8')
const seed = (contents: string) => writeFile(join(root, '.gitignore'), contents, 'utf8')

describe('ignorePattern', () => {
  it('ignores the directory when the picks file has one', () => {
    expect(ignorePattern('.quello/picks.json')).toBe('.quello/')
    expect(ignorePattern('tmp/nested/picks.json')).toBe('tmp/nested/')
  })

  it('ignores just the file when it sits at the root', () => {
    expect(ignorePattern('picks.json')).toBe('picks.json')
  })
})

describe('alreadyIgnored', () => {
  it('recognises the spellings a person might have used', () => {
    for (const line of ['.quello/', '.quello', '/.quello', '/.quello/', '.quello/*']) {
      expect(alreadyIgnored(`node_modules\n${line}\ndist\n`, '.quello/')).toBe(true)
    }
  })

  it('ignores surrounding whitespace', () => {
    expect(alreadyIgnored('  .quello/  \n', '.quello/')).toBe(true)
  })

  it('does not match a different entry that merely starts the same', () => {
    expect(alreadyIgnored('.quello-cache/\n', '.quello/')).toBe(false)
    expect(alreadyIgnored('# .quello/\n', '.quello/')).toBe(false)
  })
})

describe('ensureGitignored', () => {
  it('creates the file when there is none', async () => {
    expect(await ensureGitignored(root, { picksFile: '.quello/picks.json' })).toBe('created')
    expect(await read()).toContain('.quello/')
  })

  it('appends without disturbing what is there', async () => {
    await seed('node_modules\ndist\n')
    expect(await ensureGitignored(root, { picksFile: '.quello/picks.json' })).toBe('appended')
    const written = await read()
    expect(written.startsWith('node_modules\ndist\n')).toBe(true)
    expect(written).toContain('.quello/')
  })

  it('separates cleanly from a file with no trailing newline', async () => {
    await seed('node_modules')
    await ensureGitignored(root, { picksFile: '.quello/picks.json' })
    expect(await read()).toContain('node_modules\n\n# quello')
  })

  it('does nothing when the pattern is already ignored', async () => {
    await seed('node_modules\n.quello\n')
    expect(await ensureGitignored(root, { picksFile: '.quello/picks.json' })).toBe('skipped')
    expect(await read()).toBe('node_modules\n.quello\n')
  })

  it('is safe to run repeatedly', async () => {
    await ensureGitignored(root, { picksFile: '.quello/picks.json' })
    const once = await read()
    expect(await ensureGitignored(root, { picksFile: '.quello/picks.json' })).toBe('skipped')
    expect(await read()).toBe(once)
  })

  it('follows a custom picks file', async () => {
    await ensureGitignored(root, { picksFile: 'tmp/session/picks.json' })
    const written = await read()
    expect(written).toContain('tmp/session/')
    expect(written).not.toContain('.quello/')
  })
})
