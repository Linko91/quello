# Project notes

<!-- quello:start -->
## quello — visual element picks

The user can point at elements in the browser and label them `PICK 1`, `PICK 2`, …

When the user references `PICK <n>` (or says "quello"), read `.quello/picks.json` and resolve the
entry whose `id` is `<n>` to locate the source element/component. Each entry carries:

- `selector` / `domPath` — where the element sits in the DOM
- `tag`, `classes`, `attributes`, `text` — what it is
- `html` — its markup, when the developer enabled it (may be elided in the middle with ` … `)
- `rect` / `style` — its computed box and presentation (font, color, spacing, radius)
- `framework` — component name and, when available, the source `file` and `line`
- `page` — the URL and title of the page the pick was made on

Prefer `framework.file` + `framework.line` to jump straight to the source; fall back to
searching the codebase for the component name, selector, or text.

`.quello/picks.json` is rewritten by the dev server on every pick and is safe to delete.
<!-- quello:end -->
