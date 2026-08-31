import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_BASE_PATH, resolveOptions } from '../src/options'

const previous = { env: process.env.NODE_ENV, options: process.env.QUELLO_OPTIONS }

beforeEach(() => {
  process.env.NODE_ENV = 'development'
  delete process.env.QUELLO_OPTIONS
})

afterEach(() => {
  process.env.NODE_ENV = previous.env
  if (previous.options === undefined) delete process.env.QUELLO_OPTIONS
  else process.env.QUELLO_OPTIONS = previous.options
})

describe('resolveOptions', () => {
  it('matches the Vite plugin defaults', () => {
    expect(resolveOptions()).toMatchObject({
      enabled: true,
      basePath: DEFAULT_BASE_PATH,
      picksFile: '.quello/picks.json',
      shortcut: 'alt+q',
      textLimit: 120,
      writeAgentFile: true,
      agentFile: 'AGENTS.md',
      gitignorePicks: true,
      htmlMode: 'truncated',
      htmlLimit: 1000,
      theme: {},
    })
  })

  it('reads what withQuello published', () => {
    process.env.QUELLO_OPTIONS = JSON.stringify({ shortcut: 'f2', htmlLimit: 40 })
    expect(resolveOptions()).toMatchObject({ shortcut: 'f2', htmlLimit: 40, textLimit: 120 })
  })

  it('lets a call override the config', () => {
    process.env.QUELLO_OPTIONS = JSON.stringify({ shortcut: 'f2' })
    expect(resolveOptions({ shortcut: 'ctrl+shift+p' }).shortcut).toBe('ctrl+shift+p')
  })

  it('ignores undefined overrides rather than blanking a configured value', () => {
    process.env.QUELLO_OPTIONS = JSON.stringify({ shortcut: 'f2' })
    expect(resolveOptions({ shortcut: undefined }).shortcut).toBe('f2')
  })

  it('survives a corrupt environment payload', () => {
    process.env.QUELLO_OPTIONS = 'not json at all'
    expect(resolveOptions().shortcut).toBe('alt+q')
  })

  it('normalises basePath to a single leading slash', () => {
    for (const given of ['api/quello', '/api/quello', '/api/quello/', '//api/quello//']) {
      expect(resolveOptions({ basePath: given }).basePath).toBe('/api/quello')
    }
  })

  describe('enabled', () => {
    it('is off outside development, whatever the config says', () => {
      process.env.NODE_ENV = 'production'
      expect(resolveOptions().enabled).toBe(false)
      expect(resolveOptions({ enabled: true }).enabled).toBe(false)

      process.env.QUELLO_OPTIONS = JSON.stringify({ enabled: true })
      expect(resolveOptions().enabled).toBe(false)
    })

    it('can still be turned off during development', () => {
      expect(resolveOptions({ enabled: false }).enabled).toBe(false)
      process.env.QUELLO_OPTIONS = JSON.stringify({ enabled: false })
      expect(resolveOptions().enabled).toBe(false)
    })
  })
})
