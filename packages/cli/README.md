# quello

Run [quello](https://github.com/Linko91/quello) — the visual element picker for AI coding agents —
against any project, with or without a bundler. Point at an element in the browser, and your agent
knows which component you meant.

```bash
npx quello
```

No install needed. Add it as a dev dependency if you would rather pin it:

```bash
pnpm add -D quello
```

## Usage

```bash
npx quello [dir] [options]
```

It runs the picks endpoint beside your own dev server and prints the script tag to paste into your
page:

```
  quello  http://127.0.0.1:5100
  picks   /path/to/project/.quello/picks.json
  agent   AGENTS.md

  Add to your page in development:

    <script defer src="http://127.0.0.1:5100/__quello/client.js"
            data-quello-endpoint="http://127.0.0.1:5100/__quello/picks"></script>
```

The tag already carries whatever options you passed, so it can be pasted as-is.

## Two modes

**Endpoint only** — the default. Your app stays on its own dev server; quello just answers the picks
endpoint, cross-origin. This is the mode for Angular, Rails, Laravel, Django — anything that will
not take a plugin.

**`--serve`** — quello serves the directory as well, so a folder of HTML files needs nothing else
running. Paths that try to escape the served directory are refused.

```bash
npx quello              # endpoint only, for an app already on its own server
npx quello . --serve    # also serve this folder, for a plain html/js/css project
```

## Options

| | |
| --- | --- |
| `-s, --serve` | also serve `[dir]` as static files |
| `-p, --port <n>` | port to listen on — default `5100` |
| `--host <host>` | host to bind — default `127.0.0.1` |
| `--shortcut <s>` | picker shortcut, e.g. `"ctrl+shift+p"` — default `alt+q` |
| `--agent-file <f>` | agent instructions file — default `AGENTS.md` |
| `--no-agent-file` | do not write one |
| `--no-gitignore` | do not add the picks directory to `.gitignore` |
| `-h, --help` | show help |

## Routes

| | |
| --- | --- |
| `GET /__quello/client.js` | the runtime bundle |
| `GET /__quello/picks` | the current picks |
| `POST /__quello/picks` | replace them |
| `DELETE /__quello/picks` | clear them |

These are the same routes the plugins serve, so the runtime cannot tell which one it is talking to.

## On a bundler?

Use the plugin instead — the script tag is injected for you.

| | |
| --- | --- |
| [`vite-plugin-quello`](https://www.npmjs.com/package/vite-plugin-quello) | Vite 5, 6, 7 |
| [`webpack-plugin-quello`](https://www.npmjs.com/package/webpack-plugin-quello) | webpack 5 |
| [`@quello/next`](https://www.npmjs.com/package/@quello/next) | Next 14, 15, 16 |

[Full reference](https://quello.vercel.app/reference/cli) · [MIT](./LICENSE)
