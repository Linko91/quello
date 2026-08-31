---
seo:
  title: quello — point at it, then say "quello"
  description: A visual element picker for AI coding agents. Click elements in your
    running app; quello writes them to .quello/picks.json so your agent knows exactly
    which component you mean.
---

::u-page-hero
---
orientation: vertical
---
#headline
  :::u-badge
  ---
  color: neutral
  variant: subtle
  size: lg
  ---
  Dev-only · zero dependencies
  :::

#title
Point at it, then say "quello"

#description
Stop describing the button. Click it. quello is a visual element picker for AI coding agents —
what you pick lands in `.quello/picks.json` as `PICK 1`, `PICK 2`, … so your agent knows exactly
which component you mean.

#links
  :::u-button
  ---
  to: /getting-started/installation
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  variant: subtle
  to: https://github.com/Linko91/quello
  size: xl
  icon: i-simple-icons-github
  target: _blank
  ---
  View on GitHub
  :::

#bottom
  :::hero-demo
  :::
::

::u-page-section
---
title: Three steps, no prose
description: The toolbar rides along with your dev server. Nothing to wire up, nothing to
  describe.
---

#features
  :::u-page-feature
  ---
  icon: i-lucide-toggle-right
  ---
  #title
  1 · Arm the picker

  #description
  Hit the toolbar — or the keyboard shortcut. Hover anything and quello outlines it, naming
  the tag and the component that owns it.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-mouse-pointer-click
  ---
  #title
  2 · Click what you mean

  #description
  Each click pins a numbered badge to the element and appends the pick to
  `.quello/picks.json`. Add a note if the change needs one.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title
  3 · Say "quello"

  #description
  `"make PICK 2 a link instead"`. Your agent reads the file and gets the selector, the source
  file, the line and the computed styles.
  :::
::

::u-page-section
---
title: Install it where you already are
description: A plugin for your bundler, a package for Next, or a CLI that runs beside whatever
  dev server you have. All of them are dev-only and disable themselves on build.
---
  :::code-group
  ```bash [vite]
  pnpm add -D vite-plugin-quello
  ```

  ```bash [webpack]
  pnpm add -D webpack-plugin-quello
  ```

  ```bash [next]
  pnpm add -D @quello/next
  ```

  ```bash [any dev server]
  pnpm add -D quello-cli
  ```
  :::

  :::code-group
  ```ts [vite.config.ts]
  import { defineConfig } from 'vite'
  import quello from 'vite-plugin-quello'

  export default defineConfig({
    plugins: [quello()],
  })
  ```

  ```ts [next.config.ts]
  import { withQuello } from '@quello/next'

  export default withQuello({
    // your Next config
  })
  ```

  ```bash [terminal]
  # nothing to configure: point it at the dev server you already run
  npx quello --url http://localhost:3000
  ```
  :::
::

::u-page-section
---
title: Describing an element is the slow part
description: You know which element you mean. Getting an agent to know is the work — a selector,
  a component name, a file path, three sentences of "the one under the header, not the other
  one". quello replaces all of that with a click.
---

#features
  :::u-page-feature
  ---
  icon: i-lucide-file-code-2
  ---
  #title
  Straight to the source

  #description
  Vue, React, Svelte and Angular internals are read to name the component and, where the
  framework exposes it, the file and line.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-message-square-quote
  ---
  #title
  Notes your agent acts on

  #description
  Attach an instruction to a pick, then say "resolve the picks" and let the agent work through
  them.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-scan-search
  ---
  #title
  Everything it can see

  #description
  Selector, DOM path, attributes, text, computed styles and the element's box — the things a
  visual request actually depends on.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-plug
  ---
  #title
  Any bundler, or none

  #description
  A Vite plugin, a webpack plugin, a Next package, or a CLI that runs beside whatever dev server
  you already have.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield
  ---
  #title
  Development only

  #description
  Nothing reaches a production build. The plugins are dev-only and disable themselves when
  building.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-package
  ---
  #title
  Zero dependencies

  #description
  The runtime has none, and its UI lives in a shadow root so it cannot collide with your styles.
  :::
::

::u-page-section
---
title: Point at it, then say "quello"
description: Two minutes to install, and the last time you describe a button in prose.
links:
  - label: Get started
    to: /getting-started/installation
    trailingIcon: i-lucide-arrow-right
    size: xl
  - label: Read the pick object
    to: /reference/pick-object
    color: neutral
    variant: subtle
    size: xl
---
::
