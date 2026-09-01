declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// TS 6 requires a declaration for side-effect imports of non-code assets.
declare module '*.css'
