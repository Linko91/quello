# vite-plugin-quello

Vite plugin for [quello](https://github.com/Linko91/quello), the visual element picker for AI coding
agents. Point at an element in the browser, and your agent knows which component you meant.

```bash
pnpm add -D vite-plugin-quello
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import quello from 'vite-plugin-quello'

export default defineConfig({
  plugins: [quello()],
})
```

Start your dev server. That is the whole setup for a Vite SPA — the script tag is injected for you,
`AGENTS.md` gets the quello section, and `.quello/` is added to your `.gitignore`.

Press `Alt+Q`, click something, and `.quello/picks.json` appears in your project. Tell your agent
`PICK 1` and it resolves back to the source.

## Frameworks that render their own HTML

Nuxt, SvelteKit and Astro never call `transformIndexHtml`, so the tag has nowhere to be injected.
Import the virtual module from a client-only file instead — one line, and the plugin's options come
with it.

```ts
// nuxt: plugins/quello.client.ts
export default defineNuxtPlugin(() => {
  if (import.meta.dev) import('virtual:quello')
})
```

```ts
// sveltekit: src/routes/+layout.svelte
if (dev) import('virtual:quello')
```

```astro
<!-- astro: src/layouts/Layout.astro -->
{import.meta.env.DEV && <script>import('virtual:quello')</script>}
```

## Dev-only, by construction

A production build gets nothing from the plugin: no script tag, no agent file, no runtime in the
bundle — nothing to tree-shake, nothing to remember to remove.

The one thing it still does in a build is **resolve `virtual:quello` to an empty module**. It has
to: the dev guard around the import (`if (dev) import('virtual:quello')`) is a runtime check, so
the bundler still has to resolve that id while building. Rollup only warned about it; Rolldown,
which Vite 8 builds on, fails the build outright. Resolving it to `export {}` keeps the build
correct and still ships no quello code.

## Options

| Option | Default | |
| --- | --- | --- |
| `enabled` | `true` | Turn the plugin off without removing it from the config. |
| `picksFile` | `.quello/picks.json` | Where picks are persisted, relative to the project root. |
| `shortcut` | `alt+q` | Declared in full — `ctrl+shift+p`, `f2`. Nothing is implied. |
| `visibilityShortcut` | `alt+shift+q` | Hides quello and brings it back. Declared the same way. |
| `visible` | `true` | Whether the overlay is on the page at startup. |
| `textLimit` | `120` | Characters of element text kept per pick. |
| `writeAgentFile` | `true` | Write the quello instructions on first run. |
| `agentFile` | `AGENTS.md` | Any path works: `CLAUDE.md`, `GEMINI.md`. |
| `gitignorePicks` | `true` | Add the picks directory to `.gitignore` on first run. |
| `htmlMode` | `truncated` | Initial HTML capture mode; the settings panel wins after that. |
| `htmlLimit` | `1000` | Initial character budget for `truncated`. |
| `theme` | `{}` | Look of the outlines quello draws. Code-level only. |

[Full guide](https://quello-docs.vercel.app/guides/vite) ·
[Options reference](https://quello-docs.vercel.app/reference/plugin-options) · [MIT](./LICENSE)
