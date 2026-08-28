<script setup lang="ts">
import { ref } from 'vue'
import { changelog, sections } from '../content'

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
      <blockquote v-if="section.id === 'routing'">
        <p>The pick survives the route change. The element it points at does not.</p>
      </blockquote>
    </section>

    <h2>Changelog</h2>
    <table>
      <thead>
        <tr>
          <th>Version</th>
          <th>Date</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in changelog" :key="entry.version">
          <td>{{ entry.version }}</td>
          <td>{{ entry.date }}</td>
          <td>{{ entry.note }}</td>
        </tr>
      </tbody>
    </table>

    <h2>Report something</h2>
    <p>A form, for picking inputs, labels and selects rather than only text and boxes.</p>
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
          <option value="other">Other</option>
        </select>
      </div>
      <div class="field">
        <label for="details">Details</label>
        <textarea id="details" placeholder="What happened?" />
      </div>
      <div class="actions" style="margin-top: 0">
        <button class="cta" type="submit">Send</button>
        <button class="ghost" type="reset">Reset</button>
      </div>
    </form>
  </main>
</template>
