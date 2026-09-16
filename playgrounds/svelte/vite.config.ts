import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import quello from "vite-plugin-quello"

export default defineConfig({
	plugins: [svelte({ inspector: { toggleKeyCombo: "alt-m" } }), quello()],
	server: { port: 5177 }
})
