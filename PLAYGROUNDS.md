<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# Playgrounds

[README](README.md) · [Compatibility](COMPATIBILITY.md) · [Features](FEATURES.md) ·
**Playgrounds** · [Brand](BRAND.md) · [Sponsors](SPONSORS.md)

Fourteen manual test apps, one per framework and builder combination — plus a second React, Nuxt and
Next, kept because in each case the *major version* changes something quello has to deal with. They
mirror each other: same three routes, same content, so a difference you see belongs to the framework
and not to the page.

## The three shared routes

| Route | What it is for |
| --- | --- |
| `/` **Overview** | hero, feature grid, and a sticky rail beside long sections |
| `/gallery` **Gallery** | 28 near-identical tiles, plus filters that unmount them |
| `/article` **Article** | long-form text, a table, and a form with inputs and a select |

Every page is taller than the viewport, the nav is sticky, and navigation is client-side, so the
three things worth exercising by hand — scrolling, sticky positioning and route changes — are all
reachable in a few clicks.

## Ports and commands

Each one is a row of the [compatibility matrix](COMPATIBILITY.md), running:

| Playground | Port | | Playground | Port |
| --- | --- | --- | --- | --- |
| [`vue`](playgrounds/vue) | 5175 | | [`vanilla`](playgrounds/vanilla) | 5181 |
| [`react18`](playgrounds/react18) | 5176 | | [`webpack`](playgrounds/webpack) | 5182 |
| [`svelte`](playgrounds/svelte) | 5177 | | [`solid`](playgrounds/solid) | 5183 |
| [`nuxt3`](playgrounds/nuxt3) | 5178 | | [`sveltekit`](playgrounds/sveltekit) | 5184 |
| [`astro`](playgrounds/astro) | 5179 | | [`react19`](playgrounds/react19) | 5185 |
| [`next15`](playgrounds/next15) | 5180 | | [`angular`](playgrounds/angular) | 5186 (+5187) |
| [`nuxt4`](playgrounds/nuxt4) | 5188 | | [`next16`](playgrounds/next16) | 5189 |

```bash
pnpm play:vue     pnpm play:react18 pnpm play:react19  pnpm play:svelte
pnpm play:solid   pnpm play:nuxt3   pnpm play:nuxt4    pnpm play:sveltekit
pnpm play:astro   pnpm play:next15  pnpm play:next16   pnpm play:webpack
pnpm play:angular pnpm play:vanilla
```

Angular runs two processes — `ng serve` on 5186 and `quello` on 5187 — which is what the CLI route
looks like in practice.

## The two React playgrounds

`react18` and `react19` are the same app on the same Vite 8 and the same
`@vitejs/plugin-react` — the *only* difference is `react`, `react-dom` and their types. That is
deliberate: React's source location follows the React version rather than the bundler, so holding
everything else still is what makes the difference legible. Run both and pick the same feature card:

| | `react18` (5176) | `react19` (5185) |
| --- | --- | --- |
| React | 18.3.1 | 19.2.8 |
| Read from | `_debugSource` | the owner stack in `_debugStack` |
| A pick carries | component, file, **line**, column | component, file |

React 19 removed `_debugSource`, and a stack frame addresses the compiled module rather than the
source, so the line is gone and the file arrives module-relative
(`/src/components/FeatureCard.tsx`) instead of absolute. The reasoning is in
[Compatibility](COMPATIBILITY.md); `react19` is where you confirm it by hand.

## The two Nuxt playgrounds

`nuxt3` and `nuxt4` run the same app on the two Nuxt majors, and a pick knows the same things on
both — the Vue component and its file. What they exercise is the structural difference:

| | `nuxt3` (5178) | `nuxt4` (5188) |
| --- | --- | --- |
| Nuxt | 3.21.11 | 4.5.2 |
| Bundled Vite | 7.3.6 | 8.2.2 |
| App lives in | the project root | `app/` |
| Vite's root | the project root | `app/` |

That second row is why the pair exists. Nuxt 4 moved the app under `app/` and made that Vite's root,
and quello used to write `.quello/`, `AGENTS.md` and the `.gitignore` entry there — inside the source
directory rather than beside `package.json`, where an agent looks. The plugin now resolves those
against the **project** root (the nearest directory above Vite's root with a `package.json`), so both
playgrounds put them in the same place. `nuxt4` is where that stays honest.

## The two Next playgrounds

`next15` and `next16` are the same app on the two Next majors. The difference that matters is not
Next itself but the **bundler underneath it**: Next 16 makes Turbopack the default, and Turbopack
names its dev modules differently from webpack.

| | `next15` (5180) | `next16` (5189) |
| --- | --- | --- |
| Next | 15.5.24 | 16.3.4 |
| Bundler | webpack | Turbopack |
| React | 18.3.1 | 19.2.8 |
| A pick carries | component, **file** | component |

Both run React 19 internally — the App Router bundles it whatever `package.json` says — so both read
owner stacks. On webpack a frame reads `webpack-internal:///(rsc)/./app/page.tsx` and normalises
back to `app/page.tsx`. Turbopack points at the chunk that happens to hold the module,
`/_next/static/chunks/_0ltyzvd._.js`, which is a real file and exactly the wrong one: an agent would
open it and find a bundle. quello drops that frame rather than reporting it, so a Turbopack pick
carries the component name, the selector and the DOM path — all of which lead somewhere.

The playgrounds consume the packages' built `dist/` rather than their source, so run `pnpm build`
(or `pnpm dev` for watch mode) before starting one — otherwise you are exercising the previous
build. If a port is already taken Vite silently moves to the next free one, so trust the URL it
prints over the number in the table.

```bash
pnpm install
pnpm build        # required before any playground starts
pnpm play:vue     # then open the URL it prints
```

They never ship: `playgrounds/*` are private workspace packages, excluded from every published
tarball. The rest of the repo's workflow is in [Development](README.md#development).
