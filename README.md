# quello

Point at any element in your browser and tell your AI agent: "quello". Visual element picker for
Claude Code, Cursor, Codex, Windsurf & Copilot.

You pick elements in the running app; quello writes them to `.quello/picks.json` as `PICK 1`,
`PICK 2`, … Then you say *"make PICK 2 sticky"* and the agent knows exactly which component you mean.

> **MVP status** — Vite only, dev mode only. No MCP server and no Next.js adapter yet (both v2).

## Packages

| Package | Description |
| --- | --- |
| [`@quello/core`](packages/core) | Framework-agnostic browser runtime. Zero dependencies. |
| [`vite-plugin-quello`](packages/vite) | Vite plugin: injects the runtime and persists picks. |

Plus two manual test apps: [`playgrounds/vue`](playgrounds/vue) and
[`playgrounds/react`](playgrounds/react).

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import quello from 'vite-plugin-quello'

export default defineConfig({
  plugins: [quello()],
})
```

Start the dev server, then:

- **Alt+Q** (or the `quello` button, bottom right) toggles picker mode
- **Hover** highlights the element under the cursor and names its component
- **Click** assigns the next number and pins a badge to the element
- **Click a badge** to remove that pick; **Clear all** empties the list
- **Esc** leaves picker mode

Picks survive a page reload: on load the runtime re-resolves each stored selector for the current URL.

### What a pick records

```jsonc
{
  "id": 2,
  "label": "PICK 2",
  "selector": "article.card:nth-of-type(2) > p",
  "domPath": "html > body > div#app > main.page > section.card-list > article.card[2] > p",
  "tag": "p",
  "classes": [],
  "text": "Vue component name and source file.",
  "rect": { "x": 861, "y": 222, "width": 198, "height": 32, "...": "..." },
  "style": {
    "display": "block",
    "font": "13px/normal",
    "fontWeight": "400",
    "color": "rgb(238, 238, 238)",
    "background": "rgba(0, 0, 0, 0)",
    "padding": "0px",
    "margin": "0px",
    "gap": "normal",
    "borderRadius": "0px"
  },
  "framework": {
    "framework": "vue",
    "component": "CardItem",
    "file": "/abs/path/src/components/CardItem.vue"
  },
  "page": {
    "url": "http://localhost:5175/",
    "title": "quello · Vue playground"
  },
  "pickedAt": "2026-08-28T15:15:53.096Z"
}
```

`style` is read from `getComputedStyle`, so it is what the element actually renders as rather than
what a stylesheet asked for — enough to act on "make this bigger" or "why is this grey?" without
anyone describing the element in prose. `rect` and `style` are re-read on reload, so a restored pick
always describes the element as it is now.

Component metadata is best effort and dev-build only: Vue via `__vueParentComponent` (or a
`data-v-inspector` attribute), React by walking the fiber tree to the nearest named component and
reading `_debugSource` for file and line.

### Plugin options

```ts
quello({
  enabled: true,                    // turn off without removing the plugin
  picksFile: '.quello/picks.json',  // relative to the Vite root
  shortcutKey: 'q',                 // combined with Alt
  textLimit: 120,                   // characters of element text kept per pick
  claudeMd: true,                   // append the agent instructions to CLAUDE.md on first run
})
```

## The `.quello/` directory

The dev server writes picks to `.quello/picks.json` in your Vite root, pretty-printed and ordered by
`id`. It is a scratch file describing your current browser session, so **it is gitignored** — this
repo ignores `.quello/` at the root and you should do the same in your project:

```gitignore
.quello/
```

Deleting the directory is always safe; it is recreated on the next pick. The runtime keeps working
without a dev server (badges still render), it just cannot persist.

On first run the plugin also appends a short section to your `CLAUDE.md`, creating the file if
needed, telling the agent to resolve `PICK <n>` against `.quello/picks.json`. The section is fenced
in `<!-- quello:start -->` / `<!-- quello:end -->` markers and is never rewritten, so your edits
stick. Pass `claudeMd: false` to opt out.

## Development

```bash
pnpm install
pnpm build          # build both packages
pnpm test           # vitest unit tests (selector generation, computed style)
pnpm typecheck
pnpm play:vue       # http://localhost:5175
pnpm play:react     # http://localhost:5176
```

The playgrounds consume the packages' built `dist/`, so run `pnpm build` (or `pnpm dev` for watch
mode) before starting one.

## Design notes

- **Dev only.** The plugin is `apply: 'serve'` and injects nothing in a production build.
- **Isolated UI.** Every overlay element lives in one shadow root with `all: initial`, so page CSS
  cannot reach it and its CSS cannot reach the page.
- **Stable selectors.** Selector generation prefers an id, then a tag plus non-generated classes,
  and only walks up ancestors until the selector is unique. Hashed and framework-generated classes
  (`svelte-1a2b3c`, `css-1x2y3z`, `Button_root_a1b2c3`) are skipped so selectors survive rebuilds.

## License

MIT
