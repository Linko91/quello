import { defineConfig } from 'tsup'

export default defineConfig({
  // One entry per file the project touches: the layout imports `.`, `next.config`
  // imports `./config`, the route handler imports `./route`. Keeping them apart
  // also keeps `node:fs` out of the entry a client component might reach for.
  entry: { index: 'src/index.tsx', config: 'src/config.ts', route: 'src/route.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'node18',
  shims: true,
  external: ['react', 'react-dom', 'next'],
})
