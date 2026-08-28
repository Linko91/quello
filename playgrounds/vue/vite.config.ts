import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import quello from 'vite-plugin-quello'

export default defineConfig({
  plugins: [vue(), quello()],
  server: { port: 5175 },
})
