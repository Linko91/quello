<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# Playgrounds

[README](README.md) · [Compatibility](COMPATIBILITY.md) · [Features](FEATURES.md) ·
**Playgrounds** · [Brand](BRAND.md) · [Sponsors](SPONSORS.md)

Eleven manual test apps, one per framework and builder combination. They mirror each other:
same three routes, same content, so a difference you see belongs to the framework and not to the
page.

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
