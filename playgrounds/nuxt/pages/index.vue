<script setup lang="ts">
import { features, sections } from '../content'

useHead({ title: 'Overview · quello Nuxt playground' })
const clicks = ref(0)
</script>

<template>
  <main class="page">
    <header class="hero">
      <h1>Point at it, then say "quello"</h1>
      <p class="lead">
        A visual element picker for AI coding agents. Toggle picker mode with <code>Alt+Q</code>,
        click anything, and the pick lands in <code>.quello/picks.json</code>.
      </p>
      <div class="badge-row">
        <span class="pill">Nuxt 3</span>
        <span class="pill">SSR</span>
        <span class="pill">3 routes</span>
        <span class="pill">sticky nav + rail</span>
      </div>
      <div class="actions">
        <button class="cta" @click="clicks++">Clicked {{ clicks }} times</button>
        <button class="ghost">Secondary action</button>
      </div>
    </header>

    <h2>What a pick carries</h2>
    <section class="grid">
      <FeatureCard
        v-for="feature in features"
        :key="feature.title"
        :title="feature.title"
        :body="feature.body"
        :tag="feature.tag"
      />
    </section>

    <div class="split" style="margin-top: 48px">
      <aside class="rail">
        <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">
          {{ section.title }}
        </a>
      </aside>
      <div>
        <section v-for="section in sections" :id="section.id" :key="section.id">
          <h2 style="margin-top: 0">{{ section.title }}</h2>
          <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
        </section>
      </div>
    </div>
  </main>
</template>
