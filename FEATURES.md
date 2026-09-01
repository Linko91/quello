<img src="assets/quello-mark.svg" alt="" width="52" align="left" hspace="14" vspace="4">

# Features

← [README](README.md)

What the toolbar does once it is on the page: where it sits and how it gets out of the way, how
picks survive scrolling and route changes, and the preferences behind the **⚙** button. The
[README](README.md#usage) covers getting there; this is the behaviour you meet afterwards.

## Moving and collapsing the toolbar

The toolbar parks itself in the bottom-right corner and can be dragged anywhere by its **⠿** grip.
The **–** button collapses it to a single puck showing the mark, with a badge for the pick count and
the accent colour when picker mode is on; the puck is itself the drag handle, and a click that did not
travel expands the toolbar again. Collapsing keeps the dock's right edge in place, so the puck
appears where the controls just were rather than jumping.

Position and collapsed state are remembered alongside the other settings. A dragged toolbar is
clamped inside the viewport — on drop, on window resize and on load — and the clamped value is what
gets stored, so what is persisted is always what you saw. Moving or collapsing the toolbar never
rewrites `picks.json`.

## Picks across scrolling and navigation

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

## Settings panel

The **⚙** button in the toolbar opens a small panel, split into four tabs — **HTML**, **Clipboard**,
**Notes**, **Theme**. The tabs share one grid cell, so the panel is always as tall as its tallest
tab and switching never resizes it. Everything in it is a working preference, kept per-developer in
`localStorage`; anything that belongs to the project rather than the person is a [plugin
option](README.md#plugin-options) instead.

### HTML

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

### Copy to clipboard

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

Changing an HTML setting re-describes the picks you have already made, so the file on disk always
matches what the panel shows. Choices are per-developer, not per-project: they live in
`localStorage`, so a teammate cloning the repo is unaffected. The plugin's `htmlMode` / `htmlLimit`
options only set the starting point for someone who has not touched the panel yet.