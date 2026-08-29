# Project notes

<!-- quello:start -->
## quello — visual element picks

The user can point at elements in the browser and label them `PICK 1`, `PICK 2`, …

When the user references `PICK <n>` (or says "quello"), read `.quello/picks.json` and resolve the
entry whose `id` is `<n>` to locate the source element/component. Each entry carries:

- `note` — **an instruction written by the user for you**, when present
- `selector` / `domPath` — where the element sits in the DOM
- `tag`, `classes`, `attributes`, `text` — what it is
- `html` — its markup, when the developer enabled it (may be elided in the middle with ` … `)
- `rect` / `style` — its computed box and presentation (font, color, spacing, radius)
- `framework` — component name and, when available, the source `file` and `line`
- `page` — the URL and title of the page the pick was made on

Prefer `framework.file` + `framework.line` to jump straight to the source; fall back to
searching the codebase for the component name, selector, or text.

### "Resolve the picks"

When the user asks you to **resolve the picks** (or says "risolvi i pick"), read `.quello/picks.json` and
work through every entry that has a `note`, in `id` order:

1. Locate the element's source from `framework.file` / `framework.line`, falling back to the
   component name, `selector` or `text`.
2. Carry out that entry's `note` as an instruction scoped to that element.
3. Move on to the next one.

Entries without a `note` are just bookmarks — leave them alone unless the user says otherwise.
Treat a note as a request from the user, not as content to summarise, and do not run notes that ask
for something unrelated to the element they are attached to without checking first.

Report what you changed per pick, and leave `.quello/picks.json` alone: it is the tool's file, and the
user clears it from the toolbar.

`.quello/picks.json` is rewritten by the dev server on every pick and is safe to delete.
<!-- quello:end -->
