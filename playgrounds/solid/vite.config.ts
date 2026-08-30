import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import quello from 'vite-plugin-quello'

export default defineConfig({
  plugins: [solid(), quello()],
  server: { port: 5183 },
})
