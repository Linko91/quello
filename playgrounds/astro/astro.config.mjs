import { defineConfig } from 'astro/config'
import quello from 'vite-plugin-quello'

export default defineConfig({
  server: { port: 5179 },
  // Astro renders its own HTML, so the runtime arrives through the virtual module
  // that BaseLayout imports rather than through an injected script tag.
  vite: { plugins: [quello()] },
})
