# @quello/next

Next integration for [quello](https://github.com/Linko91/quello), the visual element picker for AI
coding agents. Point at an element in the browser, and your agent knows which component you meant.

```bash
pnpm add -D @quello/next
```

## Setup

Next has no plugin API, so quello arrives through the three files Next insists the project owns —
one line each, and the first writes the third for you.

```ts
// next.config.ts
import { withQuello } from '@quello/next/config'

export default withQuello({
  // your config, untouched
})
```

```tsx
// app/layout.tsx
import { Quello } from '@quello/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Quello />
      </body>
    </html>
  )
}
```

```ts
// app/api/quello/[...quello]/route.ts — written for you on the next `next dev`
import { quelloRoute } from '@quello/next/route'

export const dynamic = 'force-dynamic'

export const { GET, HEAD, POST, PUT, DELETE, OPTIONS } = quelloRoute()
```

That is it. `withQuello` also writes your `AGENTS.md` section and adds `.quello/` to `.gitignore`,
then prints where everything went.

## Dev-only, by construction

- `<Quello />` is a **Server Component that renders a script tag**, not a client component that
  imports the picker — so nothing from `@quello/core` enters your client bundle, not even as a chunk
  nobody loads. In a production build it renders `null`.
- `quelloRoute()` answers **404 on every verb** outside `next dev`. The endpoint writes to the
  filesystem, so it must not exist in a deployed build.
- `enabled` can only ever turn quello *off*. There is no way to switch it on in production.

## Options

Every [quello option](https://quello.vercel.app/reference/plugin-options), plus two of Next's own.
Pass them to `withQuello` as a second argument, or to `<Quello />` as props for a one-off.

| Option | Default | |
| --- | --- | --- |
| `basePath` | `/api/quello` | Where the route handler is mounted. |
| `scaffoldRoute` | `true` | Create the route file when it is missing. |

## Pages Router

```ts
// pages/api/quello/[...quello].ts
import { quelloApiConfig, quelloApiRoute } from '@quello/next/route'

// quello reads the body itself, so Next must not parse it first.
export const config = quelloApiConfig

export default quelloApiRoute()
```

Render `<Quello />` in `pages/_document.tsx`, inside `<body>`.

## Entry points

| Import from | For |
| --- | --- |
| `@quello/next` | `<Quello />`, and the shared types. No `node:` imports. |
| `@quello/next/config` | `withQuello` — `next.config` only. |
| `@quello/next/route` | `quelloRoute`, `quelloApiRoute`, `quelloApiConfig`. |

[Full guide](https://quello.vercel.app/guides/next) · [MIT](../../LICENSE)
