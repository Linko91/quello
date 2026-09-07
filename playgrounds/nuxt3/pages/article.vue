<script setup lang="ts">
import { changelog, sections } from '../content'

useHead({ title: 'Article · quello Nuxt playground' })
const email = ref('')
const topic = ref('bug')
</script>

<template>
  <main class="page">
    <header class="hero">
      <h1>A long page, on purpose</h1>
      <p class="lead">
        Everything below is here so there is something to scroll past. Pick an element near the top,
        scroll to the bottom, and check that the badge is still where you left it.
      </p>
    </header>

    <section v-for="section in sections" :id="`a-${section.id}`" :key="section.id">
      <h2>{{ section.title }}</h2>
      <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
    </section>

    <h2>Changelog</h2>
    <table>
      <thead>
        <tr><th>Version</th><th>Date</th><th>Note</th></tr>
      </thead>
      <tbody>
        <tr v-for="entry in changelog" :key="entry.version">
          <td>{{ entry.version }}</td><td>{{ entry.date }}</td><td>{{ entry.note }}</td>
        </tr>
      </tbody>
    </table>

    <h2>Report something</h2>
    <form class="form" @submit.prevent>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" placeholder="you@example.com" />
      </div>
      <div class="field">
        <label for="topic">Topic</label>
        <select id="topic" v-model="topic">
          <option value="bug">Bug</option>
          <option value="idea">Idea</option>
        </select>
      </div>
      <div class="actions" style="margin-top: 0">
        <button class="cta" type="submit">Send</button>
      </div>
    </form>
  </main>
</template>
