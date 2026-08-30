import type { Compiler } from 'webpack'
import {
  CLIENT_ROUTE,
  DEFAULT_PICKS_FILE,
  ensureClaudeMd,
  PICKS_ROUTE,
  resolvePicksPath,
  runtimeAttrs,
  serveClient,
  servePicks,
} from '@quello/server'
import type { QuelloHtmlMode, QuelloTheme } from '@quello/core'

export type { QuelloHtmlMode, QuelloPick, QuelloPicksFile, QuelloTheme } from '@quello/core'

export interface QuelloWebpackOptions {
  /** Turn the plugin off without removing it from the config. Defaults to `true`. */
  enabled?: boolean
  /** Where picks are persisted, relative to the compiler context. */
  picksFile?: string
  /** Full combination, e.g. `alt+q`, `ctrl+shift+p`, `f2`. */
  shortcut?: string
  textLimit?: number
  claudeMd?: boolean
  htmlMode?: QuelloHtmlMode
  htmlLimit?: number
  theme?: QuelloTheme
}

const NAME = 'QuelloWebpackPlugin'

/** `html-webpack-plugin`'s hooks, reached without depending on the package. */
interface HtmlHooks {
  alterAssetTagGroups: {
    tapAsync(
      name: string,
      fn: (
        data: { bodyTags: Array<Record<string, unknown>> },
        cb: (error: Error | null, data: unknown) => void,
      ) => void,
    ): void
  }
}

type HtmlPluginCtor = { getHooks?(compilation: unknown): HtmlHooks }

/**
 * Dev-only webpack plugin. Adds the picks endpoint to `webpack-dev-server` and,
 * when `html-webpack-plugin` is in use, the script tag that loads the runtime.
 *
 * Without `html-webpack-plugin` there is no generated HTML to add to, so the tag
 * has to go in your own template — the plugin prints it once, ready to paste.
 */
export default class QuelloWebpackPlugin {
  private readonly options: Required<Omit<QuelloWebpackOptions, 'theme'>> & { theme: QuelloTheme }

  constructor(options: QuelloWebpackOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      picksFile: options.picksFile ?? DEFAULT_PICKS_FILE,
      shortcut: options.shortcut ?? 'alt+q',
      textLimit: options.textLimit ?? 120,
      claudeMd: options.claudeMd ?? true,
      htmlMode: options.htmlMode ?? 'truncated',
      htmlLimit: options.htmlLimit ?? 1000,
      theme: options.theme ?? {},
    }
  }

  private runtime() {
    const { shortcut, textLimit, htmlMode, htmlLimit, theme } = this.options
    return { endpoint: PICKS_ROUTE, shortcut, textLimit, htmlMode, htmlLimit, theme }
  }

  /** The script tag to paste into a hand-written template. */
  scriptTag(): string {
    const attrs = Object.entries(runtimeAttrs(this.runtime()))
      .map(([name, value]) => `${name}="${value}"`)
      .join(' ')
    return `<script defer src="${CLIENT_ROUTE}" ${attrs}></script>`
  }

  apply(compiler: Compiler): void {
    if (!this.options.enabled) return
    // Production builds must not carry a dev tool, whatever the config says.
    if (compiler.options.mode === 'production') return

    const root = compiler.options.context ?? process.cwd()
    const picksPath = resolvePicksPath(root, this.options.picksFile)

    compiler.hooks.afterEnvironment.tap(NAME, () => {
      if (!this.options.claudeMd) return
      void ensureClaudeMd(root, this.options.picksFile).catch((error: Error) => {
        console.warn(`[quello] could not update CLAUDE.md: ${error.message}`)
      })
    })

    compiler.hooks.compilation.tap(NAME, (compilation) => {
      const html = (compilation.options.plugins ?? [])
        .map((plugin) => plugin?.constructor as HtmlPluginCtor | undefined)
        .find((ctor) => typeof ctor?.getHooks === 'function')
      if (!html?.getHooks) return

      html.getHooks(compilation).alterAssetTagGroups.tapAsync(NAME, (data, cb) => {
        data.bodyTags.push({
          tagName: 'script',
          voidTag: false,
          meta: { plugin: NAME },
          attributes: { defer: true, src: CLIENT_ROUTE, ...runtimeAttrs(this.runtime()) },
        })
        cb(null, data)
      })
    })

    // webpack-dev-server calls this on the compiler's plugin instances.
    const devServer = compiler.options.devServer as
      | { setupMiddlewares?: (middlewares: unknown[], server: unknown) => unknown[] }
      | undefined
    const previous = devServer?.setupMiddlewares
    if (devServer) {
      devServer.setupMiddlewares = (middlewares, server) => {
        const list = previous ? previous(middlewares, server) : middlewares
        list.unshift(
          { name: 'quello-client', path: CLIENT_ROUTE, middleware: (_req: never, res: never) => void serveClient(res) },
          {
            name: 'quello-picks',
            path: PICKS_ROUTE,
            middleware: (req: never, res: never) => void servePicks(req, res, { picksPath }),
          },
        )
        return list
      }
    }
  }
}

export { QuelloWebpackPlugin }
