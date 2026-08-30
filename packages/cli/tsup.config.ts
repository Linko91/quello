import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  dts: false,
  clean: true,
  target: 'node18',
  shims: true,
  banner: { js: '#!/usr/bin/env node' },
})
