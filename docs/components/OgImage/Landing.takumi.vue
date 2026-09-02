<script lang="ts" setup>
const { title, description } = defineProps<{ title?: string, description?: string }>()

const appConfig = useAppConfig()
const logoPath = appConfig.header?.logo?.dark || appConfig.header?.logo?.light

const logo = await fetchLogo(logoPath)

/**
 * Overrides Docus' own `OgImage/Landing`, which forces the logo to 48x48 and
 * puts it in a 48px-wide box. quello's logo is a wordmark — 86x24 in its
 * viewBox — so a square box is three and a half times too narrow: the glyphs
 * overflow it to the right and the mark reads as off-centre. Keep the height
 * and take the width from the viewBox, so the box is the size of what is in it
 * and `justify-center` centres the wordmark itself.
 */
async function fetchLogo(path?: string): Promise<{ svg: string, width: number, height: number }> {
  const height = 48
  if (!path) {
    return { svg: '', width: 0, height }
  }
  try {
    const { url: siteUrl } = useSiteConfig()
    const url = path.startsWith('http') ? path : `${siteUrl}${path}`
    const raw = await $fetch<string>(url, { responseType: 'text' })
    const viewBox = raw.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const width = viewBox
      ? Math.round((Number(viewBox[1]) / Number(viewBox[2])) * height)
      : height

    // The file already carries `width`/`height`. Prepending new ones the way Docus
    // does leaves both on the tag and the original pair wins, so the mark renders at
    // its own size inside a box sized for the new one and spills to the right. Strip
    // them first, then set ours.
    const openTag = raw.match(/<svg[^>]*>/)?.[0] ?? ''
    const sized = openTag
      .replace(/\s(?:width|height)="[^"]*"/g, '')
      .replace('<svg', `<svg width="${width}" height="${height}"`)

    return { svg: raw.replace(openTag, sized), width, height }
  }
  catch {
    return { svg: '', width: 0, height }
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col justify-center bg-neutral-950 px-[80px] py-[60px]">
    <!-- Radial glow top-right: wide soft layer -->
    <div class="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_40%,transparent_70%)]" />
    <!-- Radial glow top-right: tight bright core -->
    <div class="absolute top-0 right-0 w-[350px] h-[350px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_35%,transparent_65%)]" />

    <div class="flex-1 flex flex-col justify-center w-full">
      <div
        v-if="logo.svg"
        class="flex justify-center mb-8"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          :style="{ width: `${logo.width}px`, height: `${logo.height}px` }"
          v-html="logo.svg"
        />
      </div>
      <div
        v-if="title"
        class="flex justify-center mb-6"
      >
        <h1 class="m-0 text-[50px] font-bold text-white leading-[1.1] text-center wrap-break-word">
          {{ title?.slice(0, 60) }}
        </h1>
      </div>
      <div
        v-if="description"
        class="flex justify-center"
      >
        <p class="m-0 text-[28px] text-neutral-400 leading-[1.4] text-center wrap-break-word">
          {{ description?.slice(0, 200) }}
        </p>
      </div>
    </div>
  </div>
</template>
