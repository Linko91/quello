import quello from 'vite-plugin-quello'

// Nuxt 4 keeps the app under `app/` rather than the project root, which is the
// only structural difference from the nuxt3 playground beside it. The quello
// wiring is identical: the Vite plugin here, the virtual module in a client
// plugin, since Nuxt renders its own HTML and never calls `transformIndexHtml`.
export default defineNuxtConfig({
  devtools: { enabled: false },
  css: ['~/assets/style.css'],
  vite: {
    plugins: [quello()],
  },
})
