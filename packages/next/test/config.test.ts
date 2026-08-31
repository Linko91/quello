import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OPTIONS_ENV } from '../src/options'

const previous = { cwd: process.cwd(), env: process.env.NODE_ENV }
let root = ''

/**
 * `withQuello` writes files and prints a banner once per module graph, so every
 * test gets a fresh copy of it — and a directory of its own to write into.
 */
async function load() {
  vi.resetModules()
  const module = await import('../src/config')
  return module.withQuello
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'quello-config-'))
  process.chdir(root)
  process.env.NODE_ENV = 'development'
  delete process.env[OPTIONS_ENV]
  delete process.env.__QUELLO_ANNOUNCED
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  process.chdir(previous.cwd)
  process.env.NODE_ENV = previous.env
  delete process.env[OPTIONS_ENV]
  delete process.env.__QUELLO_ANNOUNCED
  vi.restoreAllMocks()
})

const appDir = async () => {
  await mkdir(join(root, 'app'), { recursive: true })
  await writeFile(join(root, 'tsconfig.json'), '{}', 'utf8')
}

const routeFile = join('app', 'api', 'quello', '[...quello]', 'route.ts')

describe('withQuello', () => {
  it('keeps the config it was given and adds only the options', async () => {
    const withQuello = await load()
    const config = withQuello({ reactStrictMode: true, env: { EXISTING: 'yes' } })

    expect(config.reactStrictMode).toBe(true)
    expect(config.env?.EXISTING).toBe('yes')
    expect(JSON.parse(config.env?.[OPTIONS_ENV] ?? '{}')).toMatchObject({ shortcut: 'alt+q' })
  })

  it('publishes the options on process.env too, for the same process', async () => {
    const withQuello = await load()
    withQuello({}, { shortcut: 'f2' })
    expect(JSON.parse(process.env[OPTIONS_ENV] ?? '{}')).toMatchObject({ shortcut: 'f2' })
  })

  it('writes the agent file and the .gitignore entry', async () => {
    const withQuello = await load()
    withQuello({})
    await vi.waitFor(async () => {
      expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toContain('<!-- quello:start -->')
      expect(await readFile(join(root, '.gitignore'), 'utf8')).toContain('.quello/')
    })
  })

  it('scaffolds the route handler when the app directory exists', async () => {
    await appDir()
    const withQuello = await load()
    withQuello({})

    const written = await readFile(join(root, routeFile), 'utf8')
    expect(written).toContain("from '@quello/next/route'")
    expect(written).toContain('quelloRoute()')
  })

  it('follows a custom basePath when scaffolding', async () => {
    await appDir()
    const withQuello = await load()
    withQuello({}, { basePath: '/dev/quello' })
    await expect(
      readFile(join(root, 'app', 'dev', 'quello', '[...quello]', 'route.ts'), 'utf8'),
    ).resolves.toContain('quelloRoute()')
  })

  it('leaves a route the developer already wrote alone', async () => {
    await appDir()
    await mkdir(join(root, 'app', 'api', 'quello', '[...quello]'), { recursive: true })
    await writeFile(join(root, routeFile), '// mine\n', 'utf8')

    const withQuello = await load()
    withQuello({})
    expect(await readFile(join(root, routeFile), 'utf8')).toBe('// mine\n')
  })

  it('does not scaffold when asked not to', async () => {
    await appDir()
    const withQuello = await load()
    withQuello({}, { scaffoldRoute: false })
    await expect(readFile(join(root, routeFile), 'utf8')).rejects.toThrow()
  })

  it('points out the unguarded hand-written endpoint from before the package', async () => {
    await appDir()
    await mkdir(join(root, 'app', 'api', 'quello', 'picks'), { recursive: true })
    await writeFile(join(root, 'app', 'api', 'quello', 'picks', 'route.ts'), '// old\n', 'utf8')

    const withQuello = await load()
    withQuello({})

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('no production guard'))
  })

  describe('outside development', () => {
    it('returns the config untouched', async () => {
      process.env.NODE_ENV = 'production'
      await appDir()
      const withQuello = await load()
      const input = { reactStrictMode: true }

      expect(withQuello(input)).toBe(input)
      expect(process.env[OPTIONS_ENV]).toBeUndefined()
    })

    it('writes nothing at all', async () => {
      process.env.NODE_ENV = 'production'
      await appDir()
      const withQuello = await load()
      withQuello({})

      await expect(readFile(join(root, 'AGENTS.md'), 'utf8')).rejects.toThrow()
      await expect(readFile(join(root, routeFile), 'utf8')).rejects.toThrow()
    })
  })
})
