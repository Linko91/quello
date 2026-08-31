import { defineConfig } from 'tsup'

export default defineConfig({
  // `runtime` is built on its own so it can be imported where `node:` builtins
  // are not welcome — a React Server Component, an edge handler, the browser.
  entry: { index: 'src/index.ts', runtime: 'src/runtime.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'node18',
  shims: true,
})
