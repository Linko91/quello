import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { fileExists, locatePicks, modifiedAt } from '../src/locate'

let root = ''

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-mcp-locate-'))
})

const touch = async (relative: string, body = '{}') => {
  const path = join(root, relative)
  await mkdir(join(path, '..'), { recursive: true })
  await writeFile(path, body, 'utf8')
  return path
}

describe('locatePicks', () => {
  it('takes the root it is given, ahead of anything else', async () => {
    const location = await locatePicks({ root, cwd: tmpdir(), env: {} })
    expect(location).toMatchObject({
      root,
      path: join(root, '.quello/picks.json'),
      found: false,
      via: 'option',
    })
  })

  it('reports the file as found once it exists', async () => {
    await touch('.quello/picks.json')
    expect(await locatePicks({ root, env: {} })).toMatchObject({ found: true })
  })

  it('reads QUELLO_ROOT when no root was passed', async () => {
    const location = await locatePicks({ cwd: tmpdir(), env: { QUELLO_ROOT: root } })
    expect(location).toMatchObject({ root, via: 'env' })
  })

  it('prefers the --root option over QUELLO_ROOT', async () => {
    const location = await locatePicks({ root, env: { QUELLO_ROOT: '/somewhere/else' } })
    expect(location).toMatchObject({ root, via: 'option' })
  })

  it('climbs out of a subdirectory to an existing picks file', async () => {
    await touch('.quello/picks.json')
    await mkdir(join(root, 'src/components'), { recursive: true })
    const location = await locatePicks({ cwd: join(root, 'src/components'), env: {} })
    expect(location).toMatchObject({
      root,
      path: join(root, '.quello/picks.json'),
      found: true,
      via: 'discovered',
    })
  })

  it('prefers a real picks file to a nearer package.json, as a monorepo needs', async () => {
    await touch('package.json')
    await touch('.quello/picks.json')
    await touch('apps/web/package.json')
    const location = await locatePicks({ cwd: join(root, 'apps/web'), env: {} })
    expect(location.root).toBe(root)
    expect(location.found).toBe(true)
  })

  it('falls back to the nearest project marker before the first pick', async () => {
    await touch('package.json')
    await mkdir(join(root, 'src/deep'), { recursive: true })
    const location = await locatePicks({ cwd: join(root, 'src/deep'), env: {} })
    expect(location).toMatchObject({ root, found: false, via: 'discovered' })
  })

  it('treats a .git directory as a project root too', async () => {
    await mkdir(join(root, '.git'), { recursive: true })
    await mkdir(join(root, 'app'), { recursive: true })
    expect(await locatePicks({ cwd: join(root, 'app'), env: {} })).toMatchObject({ root })
  })

  it('resolves a relative --picks-file against the root', async () => {
    const location = await locatePicks({ root, picksFile: 'tmp/other.json', env: {} })
    expect(location.path).toBe(join(root, 'tmp/other.json'))
  })

  it('takes an absolute --picks-file as it stands', async () => {
    const path = await touch('elsewhere/picks.json')
    const location = await locatePicks({ root, picksFile: path, env: {} })
    expect(location).toMatchObject({ path, found: true })
  })

  it('reads QUELLO_PICKS_FILE', async () => {
    const location = await locatePicks({ root, env: { QUELLO_PICKS_FILE: 'a/b.json' } })
    expect(location.path).toBe(join(root, 'a/b.json'))
  })

  it('discovers a non-default picks file by that name', async () => {
    await touch('custom/picks.json')
    await mkdir(join(root, 'src'), { recursive: true })
    const location = await locatePicks({
      cwd: join(root, 'src'),
      env: { QUELLO_PICKS_FILE: 'custom/picks.json' },
    })
    expect(location).toMatchObject({ root, via: 'discovered', found: true })
  })

  it('lands on the working directory when there is nothing to go on', async () => {
    const location = await locatePicks({ cwd: root, env: {} })
    expect(location).toMatchObject({ root, via: 'cwd', found: false })
  })

  it('always comes back with an absolute path', async () => {
    const location = await locatePicks({ root: '.', cwd: root, env: {} })
    expect(location.path).toBe(join(root, '.quello/picks.json'))
  })
})

describe('fileExists', () => {
  it('tells one from the other', async () => {
    const path = await touch('there.json')
    expect(await fileExists(path)).toBe(true)
    expect(await fileExists(join(root, 'not-there.json'))).toBe(false)
  })
})

describe('modifiedAt', () => {
  it('reports when the file was written, as ISO-8601', async () => {
    const path = await touch('picks.json')
    const stamp = await modifiedAt(path)
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(Date.now() - Date.parse(stamp ?? '')).toBeLessThan(60_000)
  })

  it('is null for a file that is not there, rather than throwing', async () => {
    expect(await modifiedAt(join(root, 'nope.json'))).toBe(null)
  })
})
