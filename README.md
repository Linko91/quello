<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# quello

Point at any element in your browser and tell your AI agent: "quello". Visual element picker for
Claude Code, Cursor, Codex, Windsurf & Copilot.

You pick elements in the running app; quello writes them to `.quello/picks.json` as `PICK 1`,
`PICK 2`, … Then you say *"make PICK 2 sticky"* and the agent knows exactly which component you mean.

> **MVP status** — dev mode only. Vite, webpack, or no bundler at all: eleven playgrounds cover the
> ground. Next still needs ~40 lines of its own (see [`playgrounds/next`](playgrounds/next)), and
> there is no MCP server yet.
> See [Ideas, not built yet](#ideas-not-built-yet) for what else is parked and why.

## Packages

| Package | Description |
| --- | --- |
| [`@quello/core`](packages/core) | Framework-agnostic browser runtime. Zero dependencies. |
| [`@quello/server`](packages/server) | Picks endpoint, storage and agent instructions, shared by the rest. |
| [`vite-plugin-quello`](packages/vite) | Vite plugin: injects the runtime and persists picks. |
| [`webpack-plugin-quello`](packages/webpack) | The same, for webpack and webpack-dev-server. |
| [`@quello/cli`](packages/cli) | `npx quello` — for projects with no bundler to hook into. |

Plus eleven manual test apps, one per framework and builder combination. They mirror each other:
same three routes, same content, so a difference you see belongs to the framework and not to the
page.

| Route | What it is for |
| --- | --- |
| `/` **Overview** | hero, feature grid, and a sticky rail beside long sections |
| `/gallery` **Gallery** | 28 near-identical tiles, plus filters that unmount them |
| `/article` **Article** | long-form text, a table, and a form with inputs and a select |

Every page is taller than the viewport, the nav is sticky, and navigation is client-side, so the
three things worth exercising by hand — scrolling, sticky positioning and route changes — are all
reachable in a few clicks.

Each one is a row of the [compatibility matrix](#compatibility), running:

| Playground | Port | | Playground | Port |
| --- | --- | --- | --- | --- |
| [`vue`](playgrounds/vue) | 5175 | | [`vanilla`](playgrounds/vanilla) | 5181 |
| [`react`](playgrounds/react) | 5176 | | [`webpack`](playgrounds/webpack) | 5182 |
| [`svelte`](playgrounds/svelte) | 5177 | | [`solid`](playgrounds/solid) | 5183 |
| [`nuxt`](playgrounds/nuxt) | 5178 | | [`sveltekit`](playgrounds/sveltekit) | 5184 |
| [`astro`](playgrounds/astro) | 5179 | | [`angular`](playgrounds/angular) | 5186 (+5187) |
| [`next`](playgrounds/next) | 5180 | | | |

```bash
pnpm play:vue     pnpm play:react   pnpm play:svelte   pnpm play:solid
pnpm play:nuxt    pnpm play:sveltekit  pnpm play:astro  pnpm play:next
pnpm play:webpack pnpm play:angular pnpm play:vanilla
```

Angular runs two processes — `ng serve` on 5186 and `quello` on 5187 — which is what the CLI route
looks like in practice.

## Compatibility

Two questions decide whether quello works on a project, and they are independent:

- **The builder** decides *how quello gets in* — a plugin, a virtual module, or the CLI beside it.
- **The framework** decides *what a pick can know* — whether the runtime leaves anything on the DOM
  to identify the component that rendered an element.

So Vue on webpack gets in the webpack way and still reports Vue components, while Solid on Vite gets
in the easy way and reports none. Neither axis constrains the other.

| Framework | Vite | webpack | Its own toolchain | No bundler | What a pick knows |
| --- | --- | --- | --- | --- | --- |
| **Vue** | ✅ plugin | ○ plugin | — | ○ CLI | component, file |
| **React** | ✅ plugin | ○ plugin | — | ○ CLI | component, file, line¹ |
| **Svelte** | ✅ plugin | ○ plugin | — | ○ CLI | component, file, line, column |
| **Solid** | ✅ plugin | ○ plugin | — | ○ CLI | selector, path, text |
| **Nuxt** | ✅ `virtual:quello` | — | — | — | component, file |
| **SvelteKit** | ✅ `virtual:quello` | — | — | — | component, file, line |
| **Astro** | ✅ `virtual:quello` | — | — | — | selector, path, text |
| **Next** | — | ⚠️ ~40 lines | ⚠️ ~40 lines | — | component¹ |
| **Angular** | — | — | ✅ CLI | — | component |
| **None** (html/js/css) | ○ plugin | ✅ plugin | — | ✅ CLI | selector, path, text |

✅ verified in a playground · ○ supported, not exercised here
⚠️ needs code of your own · — not a combination that exists · ¹ see the note below

Reading the table:

- **Vite** is the easy column. An SPA gets the script tag injected; a framework that renders its own
  HTML imports [`virtual:quello`](#frameworks-that-render-their-own-html) from one client-only file.
- **webpack** needs [`webpack-plugin-quello`](#webpack), which adds the tag through
  `html-webpack-plugin` and the endpoint through `webpack-dev-server`.
- **Its own toolchain** means a dev server quello cannot configure. Angular's is the case in the
  playgrounds: [`npx quello`](#no-bundler-or-a-bundler-quello-cannot-reach) runs the endpoint on its
  own port and the page carries a script tag pointing at it. The same answer works for Rails, Laravel
  or anything else that serves HTML its own way.
- **Next** is the one gap, and not because it is React. It builds on webpack or turbopack, but runs
  its own dev server rather than `webpack-dev-server`, so there is no `setupMiddlewares` to add the
  endpoint to; and it renders HTML with its own renderer rather than `html-webpack-plugin`, so there
  is no generated document to add the tag to. Both halves of the integration have to go the Next
  way: a client component importing `@quello/core`, and a route handler for `.quello/picks.json`.
  It works — see [`playgrounds/next`](playgrounds/next) — but you write those lines. Packaging them
  is on the [roadmap](#ideas-not-built-yet).

The last column is whatever the runtime leaves on the DOM in a development build. It follows the
framework rather than the integration route — with one exception worth knowing about:

> **React's source location follows the JSX compiler, not React.** Vite compiles JSX with Babel's
> development transform, which annotates every element with its file and line; Next compiles with
> SWC, which does not. Both playgrounds run React 18.3.1, and only the Vite one reports a line —
> verified by reading `_debugSource` off the fibers in each. The component name is there either way,
> so `OverviewPage` still points at the file, just without the line number.

`selector, path, text` is the floor, and it is enough for an agent to find the code — see
[what a pick can know](#what-a-pick-can-know) for why Solid and Astro sit there.

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
  the button turns accent-purple and reads `picking…`. The combination is configurable — see
  [plugin options](#plugin-options)
- **Hover** highlights the element under the cursor and names its component
- **Click** assigns the next number and pins a badge to the element
- **Click a badge** to write a note for the agent, or remove that pick from there
- **Click the pick counter** to open the list of every pick, across every page; **Clear all** lives
  at the bottom of that list
- **⚙** opens the settings panel (HTML capture, clipboard); **–** collapses the toolbar
- **Drag the ⠿ grip** to move the toolbar anywhere
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

### Moving and collapsing the toolbar

The toolbar parks itself in the bottom-right corner and can be dragged anywhere by its **⠿** grip.
The **–** button collapses it to a single puck showing the mark, with a badge for the pick count and
the accent colour when picker mode is on; the puck is itself the drag handle, and a click that did not
travel expands the toolbar again. Collapsing keeps the dock's right edge in place, so the puck
appears where the controls just were rather than jumping.

Position and collapsed state are remembered alongside the other settings. A dragged toolbar is
clamped inside the viewport — on drop, on window resize and on load — and the clamped value is what
gets stored, so what is persisted is always what you saw. Moving or collapsing the toolbar never
rewrites `picks.json`.

### Picks across scrolling and navigation

Badges are re-anchored on every animation frame, so they track their element through scrolling and
through sticky repositioning, and they scroll off the top of the screen with it rather than piling
up at the edge.

Picks outlive route changes. Each one remembers the `page` it was made on, and the runtime watches
`location.href` — through `popstate`, `hashchange` and a 250ms poll, since a client-side router
changes the URL without firing anything you can subscribe to. When the URL changes, picks belonging
to the page now on screen are re-resolved from their selectors and get their badges back, while the
rest are detached but kept.

So the list is global and the badges are local:

| | Toolbar count | Badges |
| --- | --- | --- |
| Two picks on `/`, then navigate to `/gallery` | `2 picks` | none |
| Pick something in `/gallery` | `3 picks` | `3` |
| Back to `/` | `3 picks` | `1`, `2` |
| Reload, then to `/gallery` | `3 picks` | `3` |

Re-resolving is retried a few times over the 400ms after the URL changes, because routers update the
URL before they render. A re-attached pick is re-described against the element it found, so its
`rect`, `style` and `html` describe what is on screen now.

The hash is deliberately not part of a page's identity: jumping to `#section` is not landing on
another page, so in-page anchors leave badges alone.

### Settings panel

The **⚙** button in the toolbar opens a small panel, split into four tabs — **HTML**, **Clipboard**,
**Notes**, **Theme**. The tabs share one grid cell, so the panel is always as tall as its tallest tab
and switching never resizes it. Everything in it is a working preference, kept per-developer
in `localStorage`;
anything that belongs to the project rather than the person is a [plugin option](#plugin-options)
instead.

#### HTML

How much of an element's markup each pick carries:

| Mode | `html` field |
| --- | --- |
| **None** | absent entirely |
| **Truncated** *(default)* | `outerHTML` cut to a character budget, middle elided |
| **Full** | the complete `outerHTML`, however long |

Truncation removes the **middle**, not the tail: markup carries its identity at both ends — the
opening tag with its attributes, the closing tags that show where the element sits — while the bulk
in between is the least identifying part. A `1000`-character budget on a long section gives you
`<section class="card-list"><article class="card"> … .json by the dev server.</p></section>`, and
the result is never longer than the budget. The budget is clamped to 50–100000.

#### Copy to clipboard

**Copy on pick** mirrors each selection to the clipboard as you make it, so you can paste straight
into a chat instead of pointing the agent at the file. Two scopes:

| Scope | What lands on the clipboard |
| --- | --- |
| **Last pick** *(default)* | the pick you just made, as one JSON object |
| **Whole list** | every pick so far, as a JSON array |

Both use the same shape as `.quello/picks.json`, pretty-printed, so a pasted pick is something the
agent already knows how to read. A successful copy is silent — you asked for it to happen on every
pick, so announcing it each time would only be noise — but a refused write does flash a warning.
Copying a single pick from the list with **⧉** confirms, since that one you asked for by hand.

It is **off by default**: the clipboard belongs to you, not to the tool. Copying needs the user
activation that a real click provides, which is exactly when it runs — but a pick made
programmatically (`window.__quello__` from the console) will report a failed copy.

Changing an HTML
setting re-describes the picks you have already made, so the file on disk always matches
what the panel shows. Choices are per-developer, not per-project: they live in `localStorage`, so a
teammate cloning the repo is unaffected. The plugin's `htmlMode` / `htmlLimit` options only set the
starting point for someone who has not touched the panel yet.

`attributes` is every attribute as written in the markup, in document order, with values
whitespace-collapsed and truncated at 160 characters. Nothing is filtered out — `class` and `id`
appear there too, even though `classes` already holds the cleaned-up list — because an attribute
dump that silently omits attributes is worse than a slightly redundant one. A boolean attribute
reads as an empty string, so a Vue root picks up `{ "id": "app", "data-v-app": "" }`.

`style` is read from `getComputedStyle`, so it is what the element actually renders as rather than
what a stylesheet asked for — enough to act on "make this bigger" or "why is this grey?" without
anyone describing the element in prose. `rect` and `style` are re-read on reload, so a restored pick
always describes the element as it is now.

### What a pick can know

Component metadata is best effort and dev-build only. Each framework is asked in turn, and the first
one that recognises the element answers:

| Framework | Read from | Yields |
| --- | --- | --- |
| **Vue** | `__vueParentComponent`, or a `data-v-inspector` attribute | name, source file |
| **React** | the `__reactFiber$…` key, walked up to the nearest named component | name, file and line *when the JSX compiler annotates them* |
| **Svelte** | `__svelte_meta.loc`, left on every element the dev build creates | name, file, line, column |
| **Angular** | `window.ng.getComponent` / `getOwningComponent`, Ivy's debug API | name |

Angular reports no source location — its debug API does not carry one — but the component name is
enough to find the file in one step. The compiler prefixes class names with an underscore, so
`_AppComponent` is reported as `AppComponent`.

Two frameworks deliberately have no detector:

- **Solid** compiles its reactivity away. At runtime there is no component instance to find and
  nothing on the DOM but its event delegation — this is the architecture, not a missing API. Reading
  it would mean asking projects to add `solid-devtools`' Babel plugin for a secondary field.
- **Astro** does emit `data-astro-source-file` and `data-astro-source-loc`, but its dev toolbar
  strips them from the DOM the moment it loads, and turning the toolbar off stops them being emitted
  at all. They are that tool's private detail, not an API; harvesting them would be a race against
  Astro's own init code.

Where nothing answers, `framework` is `null` and the selector, DOM path and text carry the pick on
their own — which is enough for an agent, just with one more step.

#### Agent notes

A pick can carry a `note`: free text you write for the agent, sitting right after `label` near the
top of the entry. Click a badge to open the editor — `Enter` saves, `Shift+Enter` adds a line,
`Esc` closes keeping what you typed. The box grows as you type, up to 40% of the viewport.

The panel follows the toolbar, flipping below it when there is no room above.

The editor anchors to the pick's badge. A pick made on another page has no badge to anchor to, so it
opens beside the toolbar instead, on whichever side has room.

An empty note removes the field entirely, so `note` is only ever there when you wrote one. A badge
with a note is ringed and dotted in amber.

Turn on **Ask on every pick** to have the editor open by itself as soon as you select an element.
It is off by default, so picking stays a single click when you have nothing to say.

This is what makes *"resolve the picks"* work. The section written into your
[agent file](#the-quello-directory) tells the agent
that when you ask it to resolve the picks, it should read `.quello/picks.json` and carry out each
entry's `note` against the element that entry points at, in `id` order, treating entries without a
note as bookmarks. So you can annotate five elements in the browser and then type four words.

Notes belong to you, not to the element: re-reading a pick after a reload or a route change keeps
its note intact.

#### Theme

Two surfaces for quello's own chrome — the toolbar, the puck and every popover:

| | |
| --- | --- |
| **Fill** *(default)* | solid dark surfaces |
| **Glass** | frosted and translucent, blurring whatever is beneath |

This is the tool's own appearance, and is deliberately separate from the plugin's
[`theme`](#theming-the-outlines), which styles the outlines drawn on *your* page. One is how quello
looks; the other is how quello marks your work.

### The pick list

The counter in the toolbar (`3 picks`) opens a dropdown holding every pick you have made, on every
page. Each row pairs the component (or the tag, when no framework owns the element) with the page it
belongs to, then the selector and a snippet of text to tell one instance from another, and its note
if it has one. A pick on a page you are not looking at is flagged in amber. **Clear all** sits at the
foot of the list, with the picks it empties rather than in the toolbar.

Four actions per row:

| | |
| --- | --- |
| **⤓ / ↗** | scroll until the element's top-left corner is in the middle of the viewport; on another page, go there first and scroll on arrival |
| **✎** | open the note editor — amber when the pick already carries a note |
| **⧉** | copy that one pick as JSON |
| **×** | remove it |

Hovering a row outlines its element on the page, which is usually faster than scrolling to it. The
outline is dropped if the pick it belongs to disappears while you are pointing at it.

Cross-page scrolling loads the target page outright rather than pushing to the router: the runtime
is framework-agnostic and has no way to ask *your* router to navigate. The pending scroll is handed
across the reload in `sessionStorage` and resumed once picks are restored.

Opening the list closes the settings panel and vice versa; `Esc` closes whichever is open.

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

### No bundler, or a bundler quello cannot reach

Angular's dev server, a Rails or Laravel app, three HTML files in a folder — anything that will not
take a plugin. Run quello beside it:

```bash
npx quello              # endpoint only, for an app already on its own server
npx quello . --serve    # also serve this folder, for a plain html/js/css project
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
| `hoverColor` | `#7c5cff` |
| `hoverBorderWidth` | `2px` |
| `pickedFill` | `transparent` |
| `pickedBorderColor` | `rgba(124, 92, 255, 0.85)` |
| `pickedBorderStyle` | `dashed` |
| `pickedBorderWidth` | `1.5px` |

Derived rather than configured: the hover outline's translucent fill (`color-mix` at 12% of
`hoverColor`) and the element label's background (`hoverColor` itself). Set the hover colour and the
three follow, instead of drifting apart.

Values reach the page as CSS custom properties on quello's host element, so any valid CSS value
works — `tomato`, `0.125rem`, `color-mix(...)`. Unlike normal declarations, custom properties are
not validated by the browser, so quello refuses values carrying `;`, braces or comment markers, and
falls back to the default for that one option.

The badges and the toolbar keep the brand purple: they are the tool's own UI, not marks on your
page.

## The `.quello/` directory

The dev server writes picks to `.quello/picks.json` in your Vite root, pretty-printed and ordered by
`id`. It is a scratch file describing your current browser session, so **it is gitignored** — this
repo ignores `.quello/` at the root and you should do the same in your project:

```gitignore
.quello/
```

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
pnpm build          # build both packages
pnpm test           # vitest unit tests (selectors, style, attributes, settings, notes, …)
pnpm typecheck
pnpm play:vue       # http://localhost:5175
pnpm play:react     # http://localhost:5176
```

The playgrounds consume the packages' built `dist/`, so run `pnpm build` (or `pnpm dev` for watch
mode) before starting one. If a port is already taken Vite silently moves to the next free one, so
check the URL it prints rather than assuming 5175/5176.

## Design notes

- **Dev only.** The plugin is `apply: 'serve'` and injects nothing in a production build.
- **Isolated UI.** Every overlay element lives in one shadow root with `all: initial`, so page CSS
  cannot reach it and its CSS cannot reach the page.
- **Stable selectors.** Selector generation prefers an id, then a tag plus non-generated classes,
  and only walks up ancestors until the selector is unique. Hashed and framework-generated classes
  (`svelte-1a2b3c`, `css-1x2y3z`, `Button_root_a1b2c3`) are skipped so selectors survive rebuilds.

## Brand

| File | Use |
| --- | --- |
| [`assets/quello-logo.svg`](assets/quello-logo.svg) | the wordmark — headers, the docs site, anywhere there is room to read it |
| [`assets/quello-mark.svg`](assets/quello-mark.svg) | the mark alone — favicons, avatars, the toolbar's collapsed puck |

The toolbar uses both: the wordmark on the toggle button when expanded — swapped for `picking…`
while picker mode is on — and the mark alone once collapsed.

<img src="assets/quello-logo.svg" alt="quello" width="200">

The mark is a lowercase **q** whose bowl is the picker's target ring, with the picked element as the
dot at its centre. The descender is load-bearing: without it the bowl and stem read as the lens and
handle of a magnifier, which would say *search* rather than *this one*.

The wordmark is built on the mark's grid — one stroke weight (2.6 units), one x-height (the bowl's
diameter), round caps and joins throughout — so "uello" belongs to the same alphabet as the q rather
than being a typeface set next to it.

- **Colour** — `#7c5cff` on light or dark. Both files ship in that purple; for a single-colour
  context, recolour every stroke and fill at once.
- **Minimum size** — the mark holds down to 16px; the wordmark down to 14px tall. Below that use the
  mark alone.
- **Clear space** — leave the bowl's radius (a quarter of the height) on every side.

The runtime carries its own copies as `markSvg(height)` and `logoSvg(height)` in
[`packages/core/src/brand.ts`](packages/core/src/brand.ts), drawn in `currentColor` so they inherit
whatever they sit on.

## Ideas, not built yet

Parked deliberately, with the reasoning, so picking one up later does not start from scratch.

**Already scoped as v2**

- **MCP server.** Let the agent read picks over MCP instead of from a file, so it works outside
  editors that read `CLAUDE.md`.
- **Qwik playground.** Qwik's own dev server threw `Converting circular structure to JSON` on a
  hand-rolled scaffold, with or without quello in the config — so the playground was dropped rather
  than shipped broken. The integration path is the same `virtual:quello` that Nuxt, SvelteKit and
  Astro use, so this is a scaffolding job: start from `npm create qwik@latest`.
- **`@quello/next` package.** The Next playground already proves the pieces work — the runtime
  imported from a client component, a route handler writing `.quello/picks.json`. What is missing is
  packaging those forty lines so a project does not have to write them, plus reading options from
  `next.config`.

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
  rather than temporary — see [what a pick can know](#what-a-pick-can-know). Solid would become
  possible if a project already runs `solid-devtools`' Babel plugin; Astro, only if it ever exposes
  its source annotations as a supported API.
- **`opacity` in `style`.** The computed `color` of an element inside a faded parent looks opaque,
  because the transparency lives on the ancestor. Worth adding if "why is this grey?" comes up.
- **Route-aware navigation.** Cross-page scrolling reloads the page because the runtime cannot ask
  your router to navigate. An optional hook — `quello({ navigate: (url) => router.push(url) })` —
  would make it instant for projects willing to wire it up.

## License

MIT
