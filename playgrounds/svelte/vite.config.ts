import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import quello from 'vite-plugin-quello'

export default defineConfig({
  plugins: [svelte(), quello()],
  server: { port: 5177 },
})
