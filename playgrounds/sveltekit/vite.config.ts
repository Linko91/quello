import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import quello from 'vite-plugin-quello'

export default defineConfig({
  plugins: [sveltekit(), quello()],
})
