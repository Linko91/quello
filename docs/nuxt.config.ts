export default defineNuxtConfig({
  extends: ['docus'],

  // Used for canonical tags. The sitemap does NOT read this: Docus prerenders it and
  // infers the URL from environment variables only — on Vercel, from
  // VERCEL_PROJECT_PRODUCTION_URL. See docs/README.md.
  site: {
    url: process.env.NUXT_SITE_URL || 'https://quello.vercel.app',
    name: 'quello',
  },
})
