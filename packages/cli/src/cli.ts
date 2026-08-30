import { createServer } from 'node:http'
import { resolve } from 'node:path'
import {
  CLIENT_ROUTE,
  DEFAULT_PICKS_FILE,
  ensureClaudeMd,
  PICKS_ROUTE,
  resolvePicksPath,
  runtimeAttrs,
  serveClient,
  servePicks,
} from '@quello/server'
import { resolveWithin, serveFile } from './static'

interface Args {
  dir: string
  port: number
  host: string
  serve: boolean
  claudeMd: boolean
  shortcut?: string
}

function parse(argv: string[]): Args {
  const args: Args = {
    dir: process.cwd(),
    port: 5100,
    host: '127.0.0.1',
    // `serve` off by default: the common case is an app already running on its own
    // dev server that only needs somewhere to put picks.
    serve: false,
    claudeMd: true,
  }
  const rest: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--port' || arg === '-p') args.port = Number(argv[++i])
    else if (arg === '--host') args.host = String(argv[++i])
    else if (arg === '--shortcut') args.shortcut = String(argv[++i])
    else if (arg === '--serve' || arg === '-s') args.serve = true
    else if (arg === '--no-claude-md') args.claudeMd = false
    else if (arg === '--help' || arg === '-h') rest.push('--help')
    else if (arg && !arg.startsWith('-')) args.dir = resolve(process.cwd(), arg)
  }
  if (rest.includes('--help')) {
    console.log(HELP)
    process.exit(0)
  }
  return args
}

const HELP = `quello — visual element picker for AI coding agents

  quello [dir] [options]

  Runs the picks endpoint so any project can use quello, with or without a bundler.
  Add this to your page, in development only:

    <script defer src="http://127.0.0.1:5100${CLIENT_ROUTE}"
            data-quello-endpoint="http://127.0.0.1:5100${PICKS_ROUTE}"></script>

Options
  -s, --serve         also serve [dir] as static files, for a plain html/js/css project
  -p, --port <n>      port to listen on (default 5100)
      --host <host>   host to bind (default 127.0.0.1)
      --shortcut <s>  picker shortcut, e.g. "ctrl+shift+p" (default alt+q)
      --no-claude-md  do not touch CLAUDE.md
  -h, --help          show this
`

async function main(): Promise<void> {
  const args = parse(process.argv.slice(2))
  const picksPath = resolvePicksPath(args.dir, DEFAULT_PICKS_FILE)

  if (args.claudeMd) {
    try {
      await ensureClaudeMd(args.dir, DEFAULT_PICKS_FILE)
    } catch (error) {
      console.warn(`[quello] could not update CLAUDE.md: ${(error as Error).message}`)
    }
  }

  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/'
    if (path === CLIENT_ROUTE) {
      void serveClient(res)
      return
    }
    if (path === PICKS_ROUTE) {
      // The app is usually on another port, so this endpoint has to answer it.
      void servePicks(req, res, { picksPath, cors: true })
      return
    }
    if (args.serve) {
      const target = resolveWithin(args.dir, path)
      if (target) {
        void serveFile(res, target).then((sent) => {
          if (sent) return
          res.statusCode = 404
          res.end('Not found')
        })
        return
      }
    }
    res.statusCode = 404
    res.end('Not found')
  })

  server.listen(args.port, args.host, () => {
    const origin = `http://${args.host}:${args.port}`
    const attrs = runtimeAttrs({
      endpoint: `${origin}${PICKS_ROUTE}`,
      ...(args.shortcut ? { shortcut: args.shortcut } : {}),
    })
    const attrText = Object.entries(attrs)
      .map(([name, value]) => `${name}="${value}"`)
      .join(' ')

    console.log(`\n  quello  ${origin}`)
    console.log(`  picks   ${picksPath}`)
    if (args.serve) console.log(`  serving ${args.dir}`)
    console.log(`\n  Add to your page in development:\n`)
    console.log(`    <script defer src="${origin}${CLIENT_ROUTE}" ${attrText}></script>\n`)
  })
}

void main()
