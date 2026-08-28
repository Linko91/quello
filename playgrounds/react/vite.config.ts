import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import quello from 'vite-plugin-quello'

export default defineConfig({
  plugins: [react(), quello()],
  server: { port: 5176 },
})
