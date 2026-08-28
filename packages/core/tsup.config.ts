import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    target: 'es2022',
  },
  {
    // Self-executing bundle injected into the page by vite-plugin-quello.
    entry: { 'quello.client': 'src/client.ts' },
    format: ['iife'],
    outExtension: () => ({ js: '.js' }),
    dts: false,
    clean: false,
    minify: true,
    target: 'es2020',
  },
])
