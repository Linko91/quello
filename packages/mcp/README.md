# @quello/mcp

Reach [quello](https://github.com/Linko91/quello)'s picks over the
**Model Context Protocol**. Point at an element in the browser, and your agent knows which component
you meant — without reading `AGENTS.md` first.

```bash
npx -y @quello/mcp
```

Nothing to install: your editor spawns it. Add it as a dev dependency if you would rather pin the
version with the rest of your toolchain.

```bash
pnpm add -D @quello/mcp
```

## Why

quello writes every pick to `.quello/picks.json`, and the plugins write a section into `AGENTS.md`
telling your agent to read it. That works in every editor that reads an instructions file — and does
nothing in the ones that do not.

This is the other way in. The picks arrive as tools, so the agent is *told* they exist at connect
time rather than having to be pointed at a file, and it gets them phrased for reading instead of as
raw JSON.

Both routes are live at once and neither needs the other: the picks file stays the source of truth,
and this reads it.

## Setup

The server speaks MCP over stdio. Register it once, wherever your editor keeps its MCP config:

```json
{
  "mcpServers": {
    "quello": { "command": "npx", "args": ["-y", "@quello/mcp"] }
  }
}
```

Claude Code takes it in one line:

```bash
claude mcp add quello -- npx -y @quello/mcp
```

Then start your dev server as usual, pick a few elements, and ask your agent about `PICK 2`.

## Tools

| | |
| --- | --- |
| `list_picks` | every pick, one line each — element, source file, note. Takes `detail` (`summary`, `full`), `page` and `withNotes` |
| `get_pick` | one pick by number, every recorded field |
| `resolve_picks` | the picks that carry a note, in `id` order, as a work list |

All three are read-only, and each one re-reads the picks file — you go on picking while the agent
works, so a cached answer would be the picks from a minute ago.

There is no tool that writes. The picks file belongs to quello: the user clears it from the toolbar,
and ids never shift, because `PICK 2` is a label said out loud.

## Resources and prompts

| | |
| --- | --- |
| `quello://picks` | the whole picks file, as raw JSON |
| `quello://picks/{id}` | one pick, as raw JSON |

Resources are for `@`-mentioning the picks into a chat; the JSON is byte-for-byte what
`.quello/picks.json` holds, so anything written against the file format works unchanged.

Two prompts show up in your editor's slash-command menu — `resolve-picks` and `explain-pick` — and
both arrive with the picks already in them.

## Finding the picks

An editor launches an MCP server from whichever directory it happens to be in, so the working
directory is a hint rather than an answer. With no flags, the server climbs from it looking for an
existing `.quello/picks.json` first, then for a project root (`package.json` or `.git`). An existing
picks file wins over a nearer `package.json`, which is what a monorepo needs.

Pin it explicitly when that guess is wrong:

```json
{
  "mcpServers": {
    "quello": { "command": "npx", "args": ["-y", "@quello/mcp", "--root", "/path/to/app"] }
  }
}
```

## Options

| | |
| --- | --- |
| `--root <dir>` | project root to read picks from — default: the nearest one found |
| `--picks-file <f>` | picks file, absolute or relative to the root — default `.quello/picks.json` |
| `-h, --help` | show help |
| `-v, --version` | print the version |

`QUELLO_ROOT` and `QUELLO_PICKS_FILE` do the same, for a config that is easier to set env vars in.

The startup banner goes to **stderr**, where your editor's MCP log will show it. stdout carries the
protocol and nothing else.

## As a library

The server is also importable, for a process that would rather host it than spawn one:

```ts
import { createQuelloMcpServer, serveStdio } from '@quello/mcp'

const server = createQuelloMcpServer({ picksPath: '/path/to/.quello/picks.json' })
await serveStdio(server, process.stdin, process.stdout)
```

`server.handle(message)` takes one decoded JSON-RPC message and returns the response, or `null` for a
notification — so any transport you like can sit in front of it.

## Zero dependencies

Beyond quello's own packages, none. MCP over stdio is JSON-RPC 2.0 in newline-delimited JSON, which
is a small enough thing to own outright — and the rest of quello hand-rolls its HTTP for the same
reason.

## Getting quello into the page

This package reads picks; something still has to put the picker in your app.

| | |
| --- | --- |
| [`vite-plugin-quello`](https://www.npmjs.com/package/vite-plugin-quello) | Vite 5, 6, 7 — and Nuxt, SvelteKit, Astro |
| [`webpack-plugin-quello`](https://www.npmjs.com/package/webpack-plugin-quello) | webpack 5 |
| [`@quello/next`](https://www.npmjs.com/package/@quello/next) | Next 14, 15, 16 |
| [`quello-cli`](https://www.npmjs.com/package/quello-cli) | anything else |

[Full reference](https://quello-docs.vercel.app/reference/mcp) · [MIT](./LICENSE)
