/**
 * Command-line arguments for `quello-mcp`, kept apart from `bin.ts` so they can
 * be tested without importing a module whose top level starts a server.
 */

export interface Args {
  root?: string
  picksFile?: string
  help: boolean
  version: boolean
}

export const HELP = `quello-mcp — reach quello's picks over the Model Context Protocol

  quello-mcp [dir] [options]

  Speaks MCP over stdio, so it is started by your editor rather than by you.
  Registered once, it answers three tools — list_picks, get_pick, resolve_picks —
  from the picks file quello writes as you click around your app.

    {
      "mcpServers": {
        "quello": { "command": "npx", "args": ["-y", "@quello/mcp"] }
      }
    }

Options
      --root <dir>        project root to read picks from (default: nearest one found)
      --picks-file <f>    picks file, absolute or relative to the root
                          (default .quello/picks.json)
  -h, --help              show this
  -v, --version           print the version

Environment
  QUELLO_ROOT             same as --root
  QUELLO_PICKS_FILE       same as --picks-file

  A working directory is a poor hint when an editor picks it, so with neither flag
  set the server climbs from it looking for an existing picks file first, then for
  a project root.
`

export function parseArgs(argv: readonly string[]): Args {
  const args: Args = { help: false, version: false }

  /**
   * The value after a flag, or `undefined` when the flag was given without one —
   * in which case the argument is left for the loop to read as a flag in its own
   * right, so `--root --help` still shows the help rather than losing it.
   */
  const valueAt = (index: number): string | undefined => {
    const value = argv[index + 1]
    return value === undefined || value.startsWith('-') ? undefined : value
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--root' || arg === '--picks-file') {
      const value = valueAt(i)
      if (value === undefined) continue
      if (arg === '--root') args.root = value
      else args.picksFile = value
      i++
    } else if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--version' || arg === '-v') args.version = true
    else if (arg && !arg.startsWith('-')) args.root = arg
  }
  return args
}
