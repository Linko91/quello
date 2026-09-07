import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { realpath } from 'node:fs/promises'
import { beforeEach, describe, expect, it } from 'vitest'
import { findProjectRoot } from '../src/project-root'

let root = ''

beforeEach(async () => {
  // macOS hands out /var/… symlinks for temp dirs while `findProjectRoot`
  // resolves real paths, so compare against the resolved one.
  root = await realpath(await mkdtemp(join(tmpdir(), 'quello-project-root-')))
})

const pkg = (dir: string) => writeFile(join(dir, 'package.json'), '{}', 'utf8')

describe('findProjectRoot', () => {
  it('returns the directory itself when it holds the package.json', async () => {
    await pkg(root)
    expect(findProjectRoot(root)).toBe(root)
  })

  it('walks up to the package when the served root is nested — the Nuxt 4 case', async () => {
    await pkg(root)
    const app = join(root, 'app')
    await mkdir(app)
    expect(findProjectRoot(app)).toBe(root)
  })

  it('walks up more than one level', async () => {
    await pkg(root)
    const deep = join(root, 'app', 'pages', 'nested')
    await mkdir(deep, { recursive: true })
    expect(findProjectRoot(deep)).toBe(root)
  })

  it('stops at the nearest package, not the outermost one', async () => {
    await pkg(root)
    const inner = join(root, 'playgrounds', 'nuxt4')
    await mkdir(inner, { recursive: true })
    await pkg(inner)
    const app = join(inner, 'app')
    await mkdir(app)
    expect(findProjectRoot(app)).toBe(inner)
  })

  it('falls back to the given directory when nothing above it is a package', async () => {
    const orphan = join(root, 'no-package-here')
    await mkdir(orphan)
    // The temp dir has no package.json above it either, so there is nothing to find.
    expect(findProjectRoot(orphan)).toBe(orphan)
  })
})
