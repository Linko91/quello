---
seo:
  title: quello — point at it, then say "quello"
  description: A visual element picker for AI coding agents. Click elements in your
    running app; quello writes them to .quello/picks.json so your agent knows exactly
    which component you mean.
---

::u-page-hero
#title
Point at it, then say "quello"

#description
Stop describing the button. Click it.

quello is a visual element picker for AI coding agents. You pick elements in your running app;
it writes them to `.quello/picks.json` as `PICK 1`, `PICK 2`, … Then you say *"make PICK 2 sticky"*
and the agent knows exactly which component you mean.

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
::

::u-page-section
#title
Describing an element is the slow part

#description
You know which element you mean. Getting an agent to know is the work: a selector, a component
name, a file path, three sentences of "the one under the header, not the other one". quello
replaces all of that with a click.

#features
  :::u-page-feature
  ---
  icon: i-lucide-mouse-pointer-click
  ---
  #title
  Click, don't describe

  #description
  Toggle picker mode, click any element. It gets a number and a badge that stays pinned to it.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-file-code-2
  ---
  #title
  Straight to the source

  #description
  Vue, React, Svelte and Angular internals are read to name the component and, where the framework
  exposes it, the file and line.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-message-square-quote
  ---
  #title
  Notes your agent acts on

  #description
  Attach an instruction to a pick, then say "resolve the picks" and let the agent work through them.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-plug
  ---
  #title
  Any bundler, or none

  #description
  A Vite plugin, a webpack plugin, a Next package, or a CLI that runs beside whatever dev server you
  already have.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield
  ---
  #title
  Development only

  #description
  Nothing reaches a production build. The plugins are dev-only and disable themselves when building.
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
