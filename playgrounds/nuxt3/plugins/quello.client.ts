// Nuxt renders its own HTML, so the plugin's script tag never gets a chance to be
// injected. Importing the virtual module starts quello with the plugin's options.
export default defineNuxtPlugin(() => {
  if (import.meta.dev) import('virtual:quello')
})
