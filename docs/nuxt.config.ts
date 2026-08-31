export default defineNuxtConfig({
  extends: ['docus'],

  // Used for canonical tags. The sitemap does NOT read this: Docus prerenders it and
  // infers the URL from environment variables only — on Vercel, from
  // VERCEL_PROJECT_PRODUCTION_URL. See docs/README.md.
  site: {
    url: process.env.NUXT_SITE_URL || 'https://quello.vercel.app',
    name: 'quello',
  },

  // Docus defaults `llms.domain` to the URL it infers from the environment, which is
  // empty outside Vercel — nuxt-llms then warns on every local `dev`. Same value as
  // `site.url`, so llms.txt keeps absolute links in production too.
  llms: {
    domain: process.env.NUXT_SITE_URL || 'https://quello.vercel.app',
  },

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
