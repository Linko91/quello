<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# quello

[![npm](https://img.shields.io/npm/v/@quello/core?label=npm&color=e09000)](https://www.npmjs.com/package/@quello/core)
[![dependencies](https://img.shields.io/badge/dependencies-zero-e09000)](packages/core/package.json)
[![node](https://img.shields.io/node/v/@quello/core?label=node&color=e09000)](https://nodejs.org)
[![types](https://img.shields.io/npm/types/@quello/core?label=types&color=e09000)](https://www.typescriptlang.org)
[![license](https://img.shields.io/npm/l/@quello/core?label=license&color=e09000)](LICENSE)
[![docs](https://img.shields.io/badge/docs-quello--docs.vercel.app-e09000)](https://quello-docs.vercel.app)

**README** · [Compatibility](COMPATIBILITY.md) · [Features](FEATURES.md) ·
[Playgrounds](PLAYGROUNDS.md) · [Brand](BRAND.md) · [Sponsors](SPONSORS.md)

Point at any element in your browser and tell your AI agent: "quello". Visual element picker for
Claude Code, Cursor, Codex, Windsurf & Copilot.

You pick elements in the running app; quello writes them to `.quello/picks.json` as `PICK 1`,
`PICK 2`, … Then you say *"make PICK 2 sticky"* and the agent knows exactly which component you mean.

> **MVP status** — dev mode only. Vite, webpack, Next, or no bundler at all: eleven playgrounds
> cover the ground. There is no MCP server yet.
> See [Ideas, not built yet](#ideas-not-built-yet) for what else is parked and why.

Built and maintained by one person. If quello saves you the paragraph you were about to write,
you can [sponsor it](#sponsor).

## Packages

| Package | Description |
| --- | --- |
| [`@quello/core`](packages/core) | Framework-agnostic browser runtime. Zero dependencies. |
| [`@quello/server`](packages/server) | Picks endpoint, storage and agent instructions, shared by the rest. |
| [`vite-plugin-quello`](packages/vite) | Vite plugin: injects the runtime and persists picks. |
| [`webpack-plugin-quello`](packages/webpack) | The same, for webpack and webpack-dev-server. |
| [`@quello/next`](packages/next) | Next integration: a config wrapper, a component and a route. |
| [`quello-cli`](packages/cli) | `npx quello-cli` — for projects with no bundler to hook into. |

Whether quello can get into your project, and what a pick will know once it is there, are two
separate questions — [COMPATIBILITY.md](COMPATIBILITY.md) answers both, as a matrix of every
framework against every way in. Every row has a matching test app in
[`playgrounds/`](playgrounds), one per framework and builder combination;
[PLAYGROUNDS.md](PLAYGROUNDS.md) has their shared routes, ports and `pnpm play:*` commands.

## Install

Every quello package is a development dependency. The plugins are `apply: 'serve'`, `<Quello />`
renders `null` in a production build and its route answers `404` — nothing here reaches your users,
so nothing here belongs in `dependencies`.

Install the one package that matches your builder column in the
[compatibility matrix](COMPATIBILITY.md); each plugin pulls in `@quello/core` and `@quello/server`
itself.

| Your setup | Install |
| --- | --- |
| **Vite** — and Nuxt, SvelteKit or Astro, which are Vite underneath | `npm i -D vite-plugin-quello` |
| **webpack** / webpack-dev-server | `npm i -D webpack-plugin-quello` |
| **Next** — App or Pages Router, Turbopack included | `npm i -D @quello/next` |
| **Anything with a dev server quello cannot configure** — Angular, Rails, Laravel, plain HTML | `npx quello-cli` — nothing to install |

Swap the prefix for your package manager — `pnpm add -D`, `yarn add -D` and `bun add -d` take the
same names. quello needs **Node 18 or newer**, the same floor as the frameworks it plugs into.

The CLI needs no install at all: `npx quello-cli` fetches and runs it on the spot. Add it to
`devDependencies` only if you would rather pin its version with the rest of your toolchain.

One line of config then wires it up — see [Usage](#usage). Start the dev server and the toolbar
appears bottom right; if it does not, the plugin is running in a production build, where it is meant
to be inert.

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

- **Alt+Q** (or the wordmark button in the toolbar, bottom right) toggles picker mode; while picking
  the button turns amber and reads `picking…`. The combination is configurable — see
  [plugin options](#plugin-options)
- **Hover** highlights the element under the cursor and names its component
- **Click** assigns the next number and pins a badge to the element
- **Click a badge** to write a note for the agent, or remove that pick from there
- **Click the pick counter** to open the [pick list](FEATURES.md#the-pick-list) — every pick, on
  every page; **Clear all** lives at the bottom of it
- **⚙** opens the [settings panel](FEATURES.md#settings-panel) (HTML capture, clipboard); **–**
  collapses the toolbar
- **Drag the ⠿ grip** to [move the toolbar](FEATURES.md#moving-and-collapsing-the-toolbar) anywhere
- **Esc** closes the panel if it is open, otherwise leaves picker mode

Picks survive a page reload: on load the runtime re-resolves each stored selector for the current URL.

### What a pick records

```jsonc
{
  "id": 2,
  "label": "PICK 2",
  "note": "make this full width on mobile",
  "selector": "article.card:nth-of-type(2) > p",
  "domPath": "html > body > div#app > main.page > section.card-list > article.card[2] > p",
  "tag": "p",
  "classes": [],
  "attributes": {},
  "text": "Vue component name and source file.",
  "html": "<p>Vue component name and source file.</p>",
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

`attributes` is every attribute as written in the markup, in document order, with values
whitespace-collapsed and truncated at 160 characters. Nothing is filtered out — `class` and `id`
appear there too, even though `classes` already holds the cleaned-up list — because an attribute
dump that silently omits attributes is worse than a slightly redundant one. A boolean attribute
reads as an empty string, so a Vue root picks up `{ "id": "app", "data-v-app": "" }`.

`style` is read from `getComputedStyle`, so it is what the element actually renders as rather than
what a stylesheet asked for — enough to act on "make this bigger" or "why is this grey?" without
anyone describing the element in prose. `rect` and `style` are re-read on reload, so a restored pick
always describes the element as it is now.

How the toolbar itself behaves — dragging and collapsing it, how badges survive scrolling and route
changes, what the four settings tabs control and what the pick list can do — is in
[FEATURES.md](FEATURES.md).

#### Agent notes

A pick can carry a `note`: free text you write for the agent, sitting right after `label` near the
top of the entry. Click a badge to open the editor — `Enter` saves, `Shift+Enter` adds a line,
`Esc` closes keeping what you typed. The box grows as you type, up to 40% of the viewport.

The editor anchors to the pick's badge. A pick made on another page has no badge to anchor to, so it
opens beside the toolbar instead, on whichever side has room — following the toolbar, and flipping
below it when there is no room above.

An empty note removes the field entirely, so `note` is only ever there when you wrote one. A badge
with a note is ringed and dotted in amber.

Turn on **Ask on every pick** to have the editor open by itself as soon as you select an element.
It is off by default, so picking stays a single click when you have nothing to say.

This is what makes *"resolve the picks"* work: the section quello writes into your
[agent file](#the-quello-directory) tells the agent to read `.quello/picks.json` and carry out each
entry's `note` against the element it points at, in `id` order, treating entries without a note as
bookmarks. So you can annotate five elements in the browser and then type four words.

Notes belong to you, not to the element: re-reading a pick after a reload or a route change keeps
its note intact.

### The shortcut

`shortcut` is a whole combination, not a key with `Alt` assumed around it, so anything works:

```ts
quello({ shortcut: 'alt+q' })          // the default
quello({ shortcut: 'ctrl+shift+p' })   // no Alt in sight
quello({ shortcut: 'cmd+k' })          // cmd, command, meta, super and win all mean Meta
quello({ shortcut: 'f2' })             // no modifier at all
```

Parsing is case-insensitive and forgiving of spaces; `opt`/`option` mean Alt, `control` means Ctrl,
`esc` means Escape. A string naming no key at all falls back to `alt+q`.

Matching uses the physical key code as well as the character, because holding Alt rewrites the
character on macOS — `Alt+Q` arrives as `œ` — and a shortcut that only compared characters would
never fire there.

A combination with **no** Alt, Ctrl or Cmd is ignored while the focus is in an input, textarea,
select or contenteditable, so a bare `q` cannot toggle picker mode mid-sentence. Combinations that
hold a modifier are not filtered, since they do not collide with typing.

### webpack

```js
// webpack.config.js
import QuelloWebpackPlugin from 'webpack-plugin-quello'

export default {
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' }), new QuelloWebpackPlugin()],
  devServer: { port: 3000 },
}
```

It takes the same options as the Vite plugin. The script tag goes in through `html-webpack-plugin`;
without it there is no generated HTML to add to, and `plugin.scriptTag()` returns the tag to paste
into your own template. Production builds are skipped whatever the config says.

### Next

```ts
// next.config.ts
import { withQuello } from '@quello/next/config'

export default withQuello({
  // your config, untouched
})
```

```tsx
// app/layout.tsx
import { Quello } from '@quello/next'

// …inside <body>, once
<Quello />
```

On the next `next dev`, `withQuello` writes the agent file, the `.gitignore` entry and the route
handler at `app/api/quello/[...quello]/route.ts`, then prints where each went. It takes the same
options as the plugins, plus `basePath` and `scaffoldRoute`.

`<Quello />` is a Server Component rendering a script tag, so nothing from `@quello/core` reaches
your client bundle, and both halves are dead in a production build: the component renders `null` and
the route answers `404`. Full details, Pages Router included, in the
[Next guide](https://quello-docs.vercel.app/guides/next).

### No bundler, or a bundler quello cannot reach

Angular's dev server, a Rails or Laravel app, three HTML files in a folder — anything that will not
take a plugin. Run quello beside it:

```bash
npx quello-cli              # endpoint only, for an app already on its own server
npx quello-cli . --serve    # also serve this folder, for a plain html/js/css project
```

It prints the tag to paste into your page:

```html
<script defer src="http://127.0.0.1:5100/__quello/client.js"
        data-quello-endpoint="http://127.0.0.1:5100/__quello/picks"></script>
```

The endpoint answers cross-origin, since your app is usually on a different port. It writes the same
`.quello/picks.json` and the same agent-file section as every other integration — the agent cannot
tell which one you used.

### Frameworks that render their own HTML

`transformIndexHtml` is a Vite SPA hook: Nuxt, Astro and SvelteKit build their document themselves
and never call it. For those, keep the plugin in the Vite config — it still serves the runtime, the
picks endpoint and the agent file — and import the virtual module from a client-only file:

```ts
// Nuxt — plugins/quello.client.ts
export default defineNuxtPlugin(() => {
  if (import.meta.dev) import('virtual:quello')
})
```

```astro
<!-- Astro — in your base layout, before </body> -->
{import.meta.env.DEV && <script>import('virtual:quello')</script>}
```

The module is generated by the plugin, so the options you passed it — shortcut, theme, HTML mode —
apply exactly as they would to an injected tag. In a production build it resolves to nothing.

### Plugin options

```ts
quello({
  enabled: true,                    // turn off without removing the plugin
  picksFile: '.quello/picks.json',  // relative to the Vite root
  shortcut: 'alt+q',                // full combination, nothing implied
  textLimit: 120,                   // characters of element text kept per pick
  writeAgentFile: true,             // write the agent instructions on first run
  agentFile: 'AGENTS.md',           // or CLAUDE.md, GEMINI.md, .github/copilot-instructions.md…
  gitignorePicks: true,             // add the picks directory to .gitignore on first run
  htmlMode: 'truncated',            // initial setting: 'none' | 'truncated' | 'full'
  htmlLimit: 1000,                  // initial character budget for 'truncated'
  theme: { /* see below */ },       // look of the outlines drawn on the page
})
```

### Theming the outlines

How the two outlines look is set in code, at plugin setup — not in the toolbar, which is for what
you change while working. Six values, everything else derived from them:

```ts
quello({
  theme: {
    hoverColor: '#0ea5e9',                  // hover outline; its fill and label follow
    hoverBorderWidth: 3,                    // a bare number means px
    pickedFill: 'rgba(16, 185, 129, 0.12)', // inside a picked element
    pickedBorderColor: '#10b981',
    pickedBorderStyle: 'solid',             // solid | dashed | dotted | double
    pickedBorderWidth: 2,
  },
})
```

| Option | Default |
| --- | --- |
| `hoverColor` | `#e09000` |
| `hoverBorderWidth` | `2px` |
| `pickedFill` | `transparent` |
| `pickedBorderColor` | `rgba(224, 144, 0, 0.85)` |
| `pickedBorderStyle` | `dashed` |
| `pickedBorderWidth` | `1.5px` |

Derived rather than configured: the hover outline's translucent fill (`color-mix` at 12% of
`hoverColor`) and the element label's background (`hoverColor` itself). Set the hover colour and the
three follow, instead of drifting apart.

Values reach the page as CSS custom properties on quello's host element, so any valid CSS value
works — `tomato`, `0.125rem`, `color-mix(...)`. Unlike normal declarations, custom properties are
not validated by the browser, so quello refuses values carrying `;`, braces or comment markers, and
falls back to the default for that one option.

The badges and the toolbar keep the brand amber: they are the tool's own UI, not marks on your
page.

## The `.quello/` directory

The dev server writes picks to `.quello/picks.json` in your Vite root, pretty-printed and ordered by
`id`. It is a scratch file describing your current browser session, so it does not belong in a
commit — quello adds it to your `.gitignore` on first run:

```gitignore
# quello — visual element picks (generated, safe to delete)
.quello/
```

It appends once and never duplicates: an entry already ignoring that path in any of its usual
spellings (`.quello`, `/.quello/`, `.quello/*`) counts, and the file is created only if you have
none. Pass `gitignorePicks: false` — or `--no-gitignore` to the CLI — to keep quello out of it. The
pattern follows `picksFile`, so a custom location is ignored instead.

Deleting the directory is always safe; it is recreated on the next pick. The runtime keeps working
without a dev server (badges still render), it just cannot persist.

On first run quello also writes a short section into an agent instructions file, creating it if
needed, telling the agent to resolve `PICK <n>` against `.quello/picks.json`.

The default is **`AGENTS.md`**, the open convention Codex, Cursor, Zed and Aider read — and which
Claude Code reads too, alongside its own `CLAUDE.md`. One file therefore reaches every agent, which
`CLAUDE.md` alone would not. Point it anywhere you like:

```ts
quello({ agentFile: 'CLAUDE.md' })                        // Claude Code only
quello({ agentFile: '.github/copilot-instructions.md' })  // directories are created as needed
quello({ writeAgentFile: false })                         // write nothing
```

The section is fenced in `<!-- quello:start -->` / `<!-- quello:end -->` markers and is never
rewritten, so your edits to it stick. Calling quello twice with two different `agentFile` values
writes both, independently.

## Development

```bash
pnpm install
pnpm build          # build every package
pnpm test           # vitest unit tests (selectors, style, attributes, settings, notes, …)
pnpm typecheck
```

The playgrounds have their own file — see [PLAYGROUNDS.md](PLAYGROUNDS.md) for every port and
`pnpm play:*` command. They consume the packages' built `dist/`, so `pnpm build` (or `pnpm dev` for
watch mode) comes first.

## Design notes

- **Dev only.** The plugin is `apply: 'serve'` and injects nothing in a production build.
- **Isolated UI.** Every overlay element lives in one shadow root with `all: initial`, so page CSS
  cannot reach it and its CSS cannot reach the page.
- **Stable selectors.** Selector generation prefers an id, then a tag plus non-generated classes,
  and only walks up ancestors until the selector is unique. Hashed and framework-generated classes
  (`svelte-1a2b3c`, `css-1x2y3z`, `Button_root_a1b2c3`) are skipped so selectors survive rebuilds.

The mark and wordmark, what they are built on and how to use them, are in
[BRAND.md](BRAND.md).

## Ideas, not built yet

Parked deliberately, with the reasoning, so picking one up later does not start from scratch.

**Already scoped as v2**

- **MCP server.** Let the agent read picks over MCP instead of from a file, so it works outside
  editors that read `CLAUDE.md`.
- **Source lines on React 19.** React 19's owner stacks give quello the file an element was written
  in, but the line in a stack frame belongs to the compiled module and browsers do not source-map
  `error.stack`. Next's dev server already resolves frames for its error overlay, at
  `/__nextjs_original-stack-frame`; asking it at pick time would put the line back. Vite has no
  equivalent endpoint, so the general answer is probably to fetch the module's source map and
  resolve the frame in the browser — worth doing once, in `@quello/core`, for every React project.

**Pick list**

These only start paying off past roughly ten picks, which is why none of them are in yet:

- **Filter or group by page.** The list already flags picks from other pages, but with picks spread
  over four routes you want to collapse it to the one you are working on.
- **Drag to reorder.** The agent works through notes in `id` order, which is the order you picked
  them in — not necessarily the order you want them done. Reordering would make the sequence
  explicit. It needs a `position` separate from `id`, since `id` is the label the user says out loud
  and must not shift.
- **Copy all notes as a task list.** `⧉` copies one pick as JSON; a plain-text list of the notes,
  each with its component and file, is what you would paste into a chat that has no repo access.
- **Renumber after deletions.** Ids intentionally never shift, so heavy editing leaves gaps
  (`1, 4, 7`). A deliberate "renumber" action would tidy that up — as an explicit choice, never
  automatically, because it invalidates any `PICK n` the user has already said.

**Smaller things**

- **Live inside Vue DevTools instead of beside it.**
  [`vite-plugin-vue-devtools`](https://devtools.vuejs.org/guide/vite-plugin) already puts a floating
  panel on the page and accepts custom tabs, so on a Vue project quello could be one of them rather
  than a second overlay competing for the same corner.

  Only half of quello can move, and the split is already in the code. The **layer** — hover outline,
  badges pinned to elements, the note editor anchored to a badge — has to stay on the page: it draws
  on top of the user's own elements and cannot do that from inside a panel. The **chrome** — the
  pick list, the settings tabs, the counter — is self-contained and would be at home in a tab, where
  it would have room the floating toolbar does not.

  So the shape is: keep `Overlay`'s layer, move `PicksList` and `SettingsPanel` behind a devtools
  tab, and keep the standalone toolbar for every other framework. The two already talk through
  handler callbacks rather than reaching into each other, which is what makes this plausible; the
  awkward part is `openNote`, which anchors to a badge on the page and would have to keep doing so
  from a panel that lives elsewhere.

  It only pays off for Vue projects that already run the devtools plugin, so it is worth doing after
  the standalone toolbar has settled — not instead of it.
- **Read `data-v-inspector` when it is there.** Related, and cheaper. That same plugin annotates
  every element with `src/App.vue:12:3` — file, **line and column**. quello already parses that
  attribute, but only as a last resort, reached when no ancestor carries a Vue instance, which in a
  real Vue app never happens. The richer location is sitting on the DOM and being ignored: Vue stays
  at "component, file" while Svelte gets down to the column. Reading the attribute *in addition to*
  the instance, rather than instead of it, is a small change to `detectVue`.
- **Open in the editor.** With a file and a line on a pick, the list could grow an action that opens
  the source directly, through the `/__open-in-editor` endpoint Vue DevTools ships and the
  launch-editor middleware Vite exposes — for the picks you want to fix yourself rather than hand to
  an agent.
- **Solid and Astro component names.** Both are ruled out for now, for reasons that are structural
  rather than temporary — see [what a pick can know](COMPATIBILITY.md#what-a-pick-can-know). Solid
  would become possible if a project already runs `solid-devtools`' Babel plugin; Astro, only if it
  ever exposes its source annotations as a supported API.
- **`opacity` in `style`.** The computed `color` of an element inside a faded parent looks opaque,
  because the transparency lives on the ancestor. Worth adding if "why is this grey?" comes up.
- **Route-aware navigation.** Cross-page scrolling reloads the page because the runtime cannot ask
  your router to navigate. An optional hook — `quello({ navigate: (url) => router.push(url) })` —
  would make it instant for projects willing to wire it up.

## Sponsor

quello is MIT and has one maintainer. What sponsorship actually pays for is the boring half: eleven
playgrounds that have to keep agreeing with the [compatibility matrix](COMPATIBILITY.md) while Vite,
webpack, Next, Nuxt, Astro and the rest move underneath them.

- **[GitHub Sponsors](https://github.com/sponsors/Linko91)** — one-off or monthly. Three tiers
  carry a listing; the amounts live on that page and nowhere in this repository, so they can change
  without a commit.
- **`npm fund`** — every published package carries the same link, so a project that already depends
  on quello can find it without leaving the terminal.

Who is listed, what each tier carries, and the ways to help that are not money at all, are in
[`SPONSORS.md`](SPONSORS.md) and on the [docs sponsor page](https://quello-docs.vercel.app/sponsor).

Sponsoring buys no priority and no private support; the issue tracker stays first-come. It buys the
time to keep that matrix honest.

## License

MIT
