<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# quello

Point at any element in your browser and tell your AI agent: "quello". Visual element picker for
Claude Code, Cursor, Codex, Windsurf & Copilot.

You pick elements in the running app; quello writes them to `.quello/picks.json` as `PICK 1`,
`PICK 2`, … Then you say *"make PICK 2 sticky"* and the agent knows exactly which component you mean.

> **MVP status** — Vite only, dev mode only. No MCP server and no Next.js adapter yet (both v2).
> See [Ideas, not built yet](#ideas-not-built-yet) for what else is parked and why.

## Packages

| Package | Description |
| --- | --- |
| [`@quello/core`](packages/core) | Framework-agnostic browser runtime. Zero dependencies. |
| [`vite-plugin-quello`](packages/vite) | Vite plugin: injects the runtime and persists picks. |

Plus two manual test apps: [`playgrounds/vue`](playgrounds/vue) and
[`playgrounds/react`](playgrounds/react). They mirror each other — same three routes, same content,
one built on vue-router and the other on react-router:

| Route | What it is for |
| --- | --- |
| `/` **Overview** | hero, feature grid, and a sticky rail beside long sections |
| `/gallery` **Gallery** | 28 near-identical tiles, plus filters that unmount them |
| `/article` **Article** | long-form text, a table, and a form with inputs and a select |

Every page is taller than the viewport, the nav is sticky, and navigation is client-side, so the
three things worth exercising by hand — scrolling, sticky positioning and route changes — are all
reachable in a few clicks.

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
and switching never resizes it. Everything in it is a working preference, kept per-developer in `localStorage`;
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

Component metadata is best effort and dev-build only: Vue via `__vueParentComponent` (or a
`data-v-inspector` attribute), React by walking the fiber tree to the nearest named component and
reading `_debugSource` for file and line.

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

This is what makes *"resolve the picks"* work. The section written into `CLAUDE.md` tells the agent
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

### Plugin options

```ts
quello({
  enabled: true,                    // turn off without removing the plugin
  picksFile: '.quello/picks.json',  // relative to the Vite root
  shortcut: 'alt+q',                // full combination, nothing implied
  textLimit: 120,                   // characters of element text kept per pick
  claudeMd: true,                   // append the agent instructions to CLAUDE.md on first run
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

On first run the plugin also appends a short section to your `CLAUDE.md`, creating the file if
needed, telling the agent to resolve `PICK <n>` against `.quello/picks.json`. The section is fenced
in `<!-- quello:start -->` / `<!-- quello:end -->` markers and is never rewritten, so your edits
stick. Pass `claudeMd: false` to opt out.

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
- **Next.js adapter.** The runtime is framework-agnostic already; what is missing is the equivalent
  of the Vite plugin for the Next dev server.

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

- **`opacity` in `style`.** The computed `color` of an element inside a faded parent looks opaque,
  because the transparency lives on the ancestor. Worth adding if "why is this grey?" comes up.
- **Route-aware navigation.** Cross-page scrolling reloads the page because the runtime cannot ask
  your router to navigate. An optional hook — `quello({ navigate: (url) => router.push(url) })` —
  would make it instant for projects willing to wire it up.

## License

MIT
