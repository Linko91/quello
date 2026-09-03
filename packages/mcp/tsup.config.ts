import { defineConfig } from 'tsup'

export default defineConfig({
  // `bin` is the stdio executable; `index` is the same server as a library, for a
  // process that would rather host it than spawn one. One config, not two: tsup
  // runs an array of configs concurrently, so a `clean` in one would race the
  // other's output. The shebang therefore lives at the top of `src/bin.ts`
  // instead of in a per-entry `banner`.
  entry: { index: 'src/index.ts', bin: 'src/bin.ts' },
  format: ['esm', 'cjs'],
  // Only the library is imported, so only the library needs types.
  dts: { entry: { index: 'src/index.ts' } },
  clean: true,
  target: 'node18',
  shims: true,
})
