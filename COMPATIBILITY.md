<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# Compatibility

[README](README.md) · **Compatibility** · [Features](FEATURES.md) ·
[Playgrounds](PLAYGROUNDS.md) · [Brand](BRAND.md)

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
| **Next** | — | ✅ `@quello/next` | ✅ `@quello/next` | — | component, file¹ |
| **Angular** | — | — | ✅ CLI | — | component |
| **None** (html/js/css) | ○ plugin | ✅ plugin | — | ✅ CLI | selector, path, text |

✅ verified in a playground · ○ supported, not exercised here
— not a combination that exists · ¹ see the note below

Reading the table:

- **Vite** is the easy column. An SPA gets the script tag injected; a framework that renders its own
  HTML imports [`virtual:quello`](README.md#frameworks-that-render-their-own-html) from one
  client-only file.
- **webpack** needs [`webpack-plugin-quello`](README.md#webpack), which adds the tag through
  `html-webpack-plugin` and the endpoint through `webpack-dev-server`.
- **Its own toolchain** means a dev server quello cannot configure. Angular's is the case in the
  playgrounds: [`npx quello-cli`](README.md#no-bundler-or-a-bundler-quello-cannot-reach) runs the
  endpoint on its own port and the page carries a script tag pointing at it. The same answer works
  for Rails, Laravel
  or anything else that serves HTML its own way.
- **Next** needs [`@quello/next`](packages/next), because Next has no plugin API: it runs its own
  dev server, so there is no `setupMiddlewares` to add the endpoint to, and it renders HTML with its
  own renderer, so there is no `transformIndexHtml` or `html-webpack-plugin` to add the tag through.
  The only places it accepts code from a package are `next.config`, a component, and a route file —
  so that is what the package is: `withQuello()`, `<Quello />`, `quelloRoute()`. One line each, and
  the first writes the third for you. It is also the only shape that survives Turbopack, which is
  why it is not built on a webpack hook. See the [Next guide](https://quello-docs.vercel.app/guides/next).

The last column is whatever the runtime leaves on the DOM in a development build. It follows the
framework rather than the integration route — with one exception worth knowing about:

> **React's source location follows the React version, not the bundler.** React ≤ 18 annotates every
> element with `_debugSource` — file, line and column — whenever the JSX compiler emits `__source`,
> which Babel's development transform and SWC both do. React 19 removed it in favour of *owner
> stacks*: an `Error` captured where the element was written. quello reads both, but a stack frame
> addresses the **compiled** module and a browser does not run `error.stack` through source maps, so
> on React 19 a pick carries the file without the line — a file the agent can search beats a line
> number that quietly points at the wrong element. Next's App Router bundles React 19 whatever your
> `package.json` says, which is why its row stops at the file; the Vite playground on React 18.3.1
> still reports the line, and will stop when it upgrades.

`selector, path, text` is the floor, and it is enough for an agent to find the code — see
[what a pick can know](#what-a-pick-can-know) for why Solid and Astro sit there.

## What a pick can know

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
