export default defineNuxtConfig({
  extends: ['docus'],

  // Docus only emits `<link rel="icon" href="/favicon.ico">`. Add the SVG so modern
  // browsers get the crisp quello mark; the .ico entry is deduped against Docus'.
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // Docus' assistant module reads `options.enabled ?? hasAiGatewayAuth`, so leaving it
  // undefined turns the AI assistant ON by itself wherever `AI_GATEWAY_API_KEY` or
  // `VERCEL_OIDC_TOKEN` exist at build time — which Vercel injects on its own. That
  // shipped a public `/mcp` server and a `/__docus__/assistant` route we never asked
  // for. An explicit value always wins, so `false` keeps it off on every deploy.
  docus: {
    assistant: {
      enabled: false,
    },
  },

  // Used for canonical tags. The sitemap does NOT read this: Docus prerenders it and
  // infers the URL from environment variables only — on Vercel, from
  // VERCEL_PROJECT_PRODUCTION_URL. See docs/README.md.
  site: {
    url: process.env.NUXT_SITE_URL || 'https://quello-docs.vercel.app',
    name: 'quello',
  },

  // Docus defaults `llms.domain` to the URL it infers from the environment, which is
  // empty outside Vercel — nuxt-llms then warns on every local `dev`. Same value as
  // `site.url`, so llms.txt keeps absolute links in production too.
  llms: {
    domain: process.env.NUXT_SITE_URL || 'https://quello-docs.vercel.app',
  },

  // The homepage's hero scene is a Vue component used from Markdown. MDC resolves
  // components through the global registry, so it has to be registered as global —
  // an auto-imported-only component is invisible to `content/index.md`.
  components: [{ path: '~/components', pathPrefix: false, global: true }],

  modules: [
    // @nuxtjs/mdc pre-bundles its transitive deps as `@nuxtjs/mdc > <pkg>` ids, which
    // Vite resolves from this directory — and under pnpm the package only exists
    // below `docus`, so every entry is reported unresolved (NUXT_B7002). Docus
    // rewrites its own `@nuxt/content > …` entries the same way. Registering from
    // `modules:done` puts this hook after the ones the modules add, so it sees the
    // finished list.
    (_options, nuxt) => {
      nuxt.hook('modules:done', () => {
        nuxt.hook('vite:extendConfig', (config) => {
          const include = config.optimizeDeps?.include
          if (!include) {
            return
          }
          config.optimizeDeps!.include = include.map(id =>
            id.replace(/^@nuxtjs\/mdc > /, 'docus > @nuxtjs/mdc > '),
          )
        })
      })
    },
  ],
})
