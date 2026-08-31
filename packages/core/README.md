# @quello/core

The framework-agnostic browser runtime behind [quello](https://github.com/Linko91/quello), the
visual element picker for AI coding agents.

**You probably do not want to install this directly.** It is the shared engine the integrations
depend on — pick the one that matches your builder and it comes along:

| | |
| --- | --- |
| [`vite-plugin-quello`](https://www.npmjs.com/package/vite-plugin-quello) | Vite 5, 6, 7 |
| [`webpack-plugin-quello`](https://www.npmjs.com/package/webpack-plugin-quello) | webpack 5 |
| [`@quello/next`](https://www.npmjs.com/package/@quello/next) | Next 14, 15, 16 |
| [`quello-cli`](https://www.npmjs.com/package/quello-cli) | the CLI, for everything else |

## What is in here

Everything that runs in the page and nothing that touches a filesystem: the picker and its overlay,
the settings panel, the draggable pill, selector generation, framework detection, theming, and the
transport that ships picks to the endpoint. No `node:` imports anywhere.

## Direct use

If you are wiring quello into something none of the integrations cover, the runtime is one call:

```ts
import { createQuello } from '@quello/core'

createQuello({
  endpoint: 'http://127.0.0.1:5100/__quello/picks',
  shortcut: 'alt+q',
})
```

It is idempotent — a second call returns the instance already on `window.__quello__` rather than
building a new one. It throws outside a browser.

## Entry points

| Import from | For |
| --- | --- |
| `@quello/core` | `createQuello`, `QuelloPicker`, the selector and theme helpers, the types. |
| `@quello/core/client` | The self-executing IIFE bundle the integrations serve as `client.js`. |

## Stability

The default export surface — `createQuello` and the option and pick types — follows semver. The
internals it re-exports (`Overlay`, `PicksTransport`, `domPath`, and friends) are shared between the
integrations in this repo and may change in a minor release.

[Docs](https://quello.vercel.app) · [MIT](./LICENSE)
