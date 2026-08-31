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

  // Used for canonical tags. The sitemap does NOT read this: Docus prerenders it and
  // infers the URL from environment variables only — on Vercel, from
  // VERCEL_PROJECT_PRODUCTION_URL. See docs/README.md.
  site: {
    url: process.env.NUXT_SITE_URL || 'https://quello.vercel.app',
    name: 'quello',
  },
})
