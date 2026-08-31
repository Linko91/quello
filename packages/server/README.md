# @quello/server

The dev-server plumbing shared by every [quello](https://github.com/Linko91/quello) integration:
the picks endpoint, the picks store on disk, the agent file, the `.gitignore` entry.

**You probably do not want to install this directly.** It is an implementation detail of the
integrations — pick the one that matches your builder and it comes along:

| | |
| --- | --- |
| [`vite-plugin-quello`](https://www.npmjs.com/package/vite-plugin-quello) | Vite 5, 6, 7 |
| [`webpack-plugin-quello`](https://www.npmjs.com/package/webpack-plugin-quello) | webpack 5 |
| [`@quello/next`](https://www.npmjs.com/package/@quello/next) | Next 14, 15, 16 |
| [`quello-cli`](https://www.npmjs.com/package/quello-cli) | the CLI, for everything else |

## Why it exists

Four integrations, one set of routes. Because every one of them serves the same
`/__quello/client.js` and `/__quello/picks`, the browser runtime cannot tell which host it is
talking to — so the picker behaves identically whether it arrived through Vite, webpack, Next or
the CLI.

## What is in here

| | |
| --- | --- |
| Routes | `serveClient`, `servePicks`, `handleQuelloRequest` — Node handlers and a `fetch` adapter. |
| Store | `resolvePicksPath`, reading and writing `.quello/picks.json`. |
| Agent file | `ensureAgentFile` — writes the quello section into `AGENTS.md` on first run. |
| gitignore | `ensureGitignored` — adds the picks directory, once. |
| Runtime | `runtimeAttrs`, `coreEsmPath` — the `data-quello-*` attributes for the script tag. |

## Entry points

| Import from | For |
| --- | --- |
| `@quello/server` | The routes, store, agent-file and gitignore helpers. |
| `@quello/server/runtime` | The runtime attribute helpers, without pulling in the Node handlers. |

## Stability

This package has no stable public API. It moves with the integrations that consume it and may
change in a minor release.

[Docs](https://quello.vercel.app) · [MIT](./LICENSE)
