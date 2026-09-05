#!/usr/bin/env node
/**
 * `quello-mcp` — the executable an editor spawns.
 *
 * Unlike the plugins and the CLI, this writes nothing into the project: no
 * `AGENTS.md`, no `.gitignore` entry. It *is* the alternative to those, and an
 * MCP server that edited the repo it was asked to read would be a surprise.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import process from 'node:process'
import { HELP, parseArgs } from './args'
import { locatePicks } from './locate'
import { createQuelloMcpServer, SERVER_VERSION } from './server'

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(`${HELP}\n`)
    return
  }
  if (args.version) {
    process.stdout.write(`${SERVER_VERSION}\n`)
    return
  }

  const location = await locatePicks({
    ...(args.root ? { root: args.root } : {}),
    ...(args.picksFile ? { picksFile: args.picksFile } : {}),
  })

  // stderr, always: stdout is the protocol channel, and a banner on it would
  // desynchronise the client on the very first message.
  process.stderr.write(
    `${[
      '',
      '  quello mcp   stdio',
      `  root         ${location.root} (${location.via})`,
      `  picks        ${location.path}${location.found ? '' : ' — not created yet'}`,
      '',
    ].join('\n')}\n`,
  )

  const server = createQuelloMcpServer({ picksPath: location.path })
  // Resolves when stdin closes, which is how an editor shuts an MCP server down.
  await server.connect(new StdioServerTransport())
}

main().catch((error: unknown) => {
  process.stderr.write(`[quello-mcp] ${(error as Error).message}\n`)
  process.exitCode = 1
})
