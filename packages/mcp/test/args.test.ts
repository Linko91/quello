import { describe, expect, it } from 'vitest'
import { HELP, parseArgs } from '../src/args'

describe('parseArgs', () => {
  it('defaults to discovery, with nothing set', () => {
    expect(parseArgs([])).toEqual({ help: false, version: false })
  })

  it('reads --root and --picks-file', () => {
    expect(parseArgs(['--root', '/app', '--picks-file', 'tmp/p.json'])).toMatchObject({
      root: '/app',
      picksFile: 'tmp/p.json',
    })
  })

  it('takes a bare directory as the root', () => {
    expect(parseArgs(['/app']).root).toBe('/app')
  })

  it('lets --root win over a bare directory that came first', () => {
    expect(parseArgs(['/first', '--root', '/second']).root).toBe('/second')
  })

  it('ignores a flag whose value is missing, so discovery still runs', () => {
    expect(parseArgs(['--root']).root).toBeUndefined()
    expect(parseArgs(['--picks-file']).picksFile).toBeUndefined()
  })

  it('does not swallow the next flag as a value', () => {
    const args = parseArgs(['--root', '--help'])
    expect(args.help).toBe(true)
    expect(args.root).toBeUndefined()
  })

  it('recognises help and version in both spellings', () => {
    expect(parseArgs(['--help']).help).toBe(true)
    expect(parseArgs(['-h']).help).toBe(true)
    expect(parseArgs(['--version']).version).toBe(true)
    expect(parseArgs(['-v']).version).toBe(true)
  })

  it('ignores flags it does not know rather than failing', () => {
    expect(parseArgs(['--wat', '--root', '/app'])).toMatchObject({ root: '/app' })
  })
})

describe('HELP', () => {
  it('shows the editor config, which is the thing people come looking for', () => {
    expect(HELP).toContain('mcpServers')
    expect(HELP).toContain('@quello/mcp')
  })

  it('names every tool the server answers', () => {
    for (const tool of ['list_picks', 'get_pick', 'resolve_picks']) {
      expect(HELP).toContain(tool)
    }
  })
})
