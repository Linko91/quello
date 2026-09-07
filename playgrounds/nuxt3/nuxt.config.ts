import quello from 'vite-plugin-quello'

export default defineNuxtConfig({
  devtools: { enabled: false },
  css: ['~/assets/style.css'],
  vite: {
    plugins: [quello()],
  },
})
