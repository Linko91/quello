/**
 * `<Quello />` — the whole client-side integration, in one tag.
 *
 * It is a **Server Component that renders a script tag**, not a client component
 * that imports the runtime. That distinction is the point:
 *
 * - nothing from `@quello/core` enters the client bundle, so a production build
 *   cannot carry the picker even as dead weight;
 * - in production the component renders `null`, so there is no tag to load;
 * - the runtime arrives from the route handler with its `data-quello-*` options
 *   attached — the same script tag the Vite and webpack plugins inject, so every
 *   integration configures the picker exactly the same way.
 */
import { CLIENT_SEGMENT, PICKS_SEGMENT, runtimeAttrs } from '@quello/server/runtime'
import type { ReactElement } from 'react'
import { resolveOptions } from './options'
import type { QuelloNextOptions } from './options'

export { DEFAULT_BASE_PATH, isDevelopment, OPTIONS_ENV, resolveOptions } from './options'
export type { QuelloNextOptions, ResolvedQuelloOptions } from './options'
export type { QuelloHtmlMode, QuelloPick, QuelloPicksFile, QuelloTheme } from '@quello/core'

/**
 * Render once, in the root layout. Props override whatever `withQuello` set in
 * `next.config`, so a one-off `shortcut` needs no config change.
 *
 * ```tsx
 * import { Quello } from '@quello/next'
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         {children}
 *         <Quello />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function Quello(props: QuelloNextOptions = {}): ReactElement | null {
  const options = resolveOptions(props)
  if (!options.enabled) return null

  const attrs = runtimeAttrs({
    endpoint: `${options.basePath}/${PICKS_SEGMENT}`,
    shortcut: options.shortcut,
    textLimit: options.textLimit,
    htmlMode: options.htmlMode,
    htmlLimit: options.htmlLimit,
    theme: options.theme,
  })

  return <script defer src={`${options.basePath}/${CLIENT_SEGMENT}`} {...attrs} />
}

export default Quello
