<script setup lang="ts">
/**
 * The second half of the loop: a pick can carry an instruction, and once a few of
 * them do, one sentence hands the lot to the agent.
 *
 * Same rules as `HeroDemo`: the note editor's copy, colours and measurements come
 * from `@quello/core` (`overlay.ts`), the example notes come from the docs' own
 * "Resolving picks" page, and nothing here is positioned by measurement except the
 * cursor.
 */

interface Step {
  id: number
  where: string
  note: string
}

const STEPS: Step[] = [
  { id: 1, where: 'src/components/PricingCta.vue:42', note: 'make it full width on mobile' },
  { id: 2, where: 'src/components/StatCard.vue:18', note: 'same padding as the card above' },
]

const stage = ref<HTMLElement | null>(null)
const badgeAEl = ref<HTMLElement | null>(null)
const badgeBEl = ref<HTMLElement | null>(null)

/** The saved note on each pick. Empty means the pick is still just a bookmark. */
const notes = ref({ a: STEPS[0].note, b: STEPS[1].note })
/** Which pick's editor is open, if any. */
const open = ref<'a' | null | 'b'>(null)
/** What is currently in the open editor's box. */
const draft = ref('')
const typing = ref(false)
const asked = ref(true)
/** How many of the agent's steps are on screen, and how many it has finished. */
const shownSteps = ref(STEPS.length)
const doneSteps = ref(STEPS.length)

const cursor = ref({ x: 0, y: 0, shown: false })
const clicking = ref(false)

let anchor: HTMLElement | null = null
let timers: ReturnType<typeof setTimeout>[] = []
let typer: ReturnType<typeof setInterval> | null = null
let observer: IntersectionObserver | null = null
let resizer: ResizeObserver | null = null
let running = false

const openId = computed(() => (open.value === 'b' ? 2 : 1))

function moveTo(el: HTMLElement | null): void {
  anchor = el
  place()
}

function place(): void {
  if (!anchor || !stage.value) return
  const frame = stage.value.getBoundingClientRect()
  const box = anchor.getBoundingClientRect()
  cursor.value = {
    x: box.left - frame.left + box.width * 0.5,
    y: box.top - frame.top + box.height * 0.6,
    shown: true,
  }
}

function tap(): void {
  clicking.value = true
  timers.push(setTimeout(() => (clicking.value = false), 320))
}

function clearTyper(): void {
  if (typer !== null) clearInterval(typer)
  typer = null
}

/** One interval rather than one timer per character. */
function typeOut(text: string): void {
  clearTyper()
  draft.value = ''
  typing.value = true
  let i = 0
  typer = setInterval(() => {
    i += 1
    draft.value = text.slice(0, i)
    if (i >= text.length) {
      clearTyper()
      typing.value = false
    }
  }, 34)
}

/**
 * Save the note and close the editor. The full text is written here rather than
 * left to `typeOut`: a backgrounded tab throttles intervals to about one tick a
 * second, and the pick would otherwise be annotated with half a sentence.
 */
function commit(key: 'a' | 'b', text: string): void {
  clearTyper()
  typing.value = false
  draft.value = text
  notes.value = { ...notes.value, [key]: text }
  open.value = null
}

/**
 * Opening an editor shows that pick's own note, so a pick without one opens
 * empty. `commit` leaves the finished text in `draft` on purpose, and `draft` is
 * shared by both editors — without seeding it here, the second pick's editor
 * opened showing the first pick's sentence until typing overwrote it.
 */
function openEditor(key: 'a' | 'b'): void {
  clearTyper()
  typing.value = false
  draft.value = notes.value[key]
  open.value = key
}

/** The state the server renders, and the one a reduced-motion reader keeps. */
function settled(): void {
  notes.value = { a: STEPS[0].note, b: STEPS[1].note }
  open.value = null
  draft.value = ''
  typing.value = false
  asked.value = true
  shownSteps.value = STEPS.length
  doneSteps.value = STEPS.length
  cursor.value = { ...cursor.value, shown: false }
}

function play(): void {
  if (!running) return
  timers = []
  const at = (ms: number, step: () => void) => timers.push(setTimeout(step, ms))

  at(0, () => {
    notes.value = { a: '', b: '' }
    open.value = null
    draft.value = ''
    asked.value = false
    shownSteps.value = 0
    doneSteps.value = 0
    moveTo(badgeAEl.value)
  })
  at(800, () => tap())
  at(900, () => openEditor('a'))
  at(1400, () => typeOut(STEPS[0].note))
  at(2700, () => commit('a', STEPS[0].note))
  at(3300, () => moveTo(badgeBEl.value))
  at(4000, () => tap())
  at(4100, () => openEditor('b'))
  at(4600, () => typeOut(STEPS[1].note))
  at(5950, () => commit('b', STEPS[1].note))
  at(6600, () => (cursor.value = { ...cursor.value, shown: false }))
  at(7000, () => (asked.value = true))
  at(7800, () => (shownSteps.value = 1))
  at(8900, () => (doneSteps.value = 1))
  at(9400, () => (shownSteps.value = 2))
  at(10500, () => (doneSteps.value = 2))
  at(14000, () => play())
}

function start(): void {
  if (running) return
  running = true
  play()
}

function stop(): void {
  running = false
  timers.forEach(clearTimeout)
  timers = []
  clearTyper()
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settled()
    return
  }

  resizer = new ResizeObserver(() => place())
  if (stage.value) resizer.observe(stage.value)

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) start()
        else stop()
      }
    },
    { threshold: 0.25 },
  )
  timers.push(
    setTimeout(() => {
      if (stage.value) observer!.observe(stage.value)
    }, 1000),
  )
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
  resizer?.disconnect()
})
</script>

<template>
  <div class="notes-scene quello-notes">
    <div ref="stage" class="stage">
      <!-- The picked elements, and the editor that opens off a badge. -->
      <div class="surface">
        <div class="surface-head">
          <span class="surface-name">Billing</span>
          <span class="surface-tag">2 picks</span>
        </div>

        <div class="targets">
          <div class="pickable">
            <button type="button" class="cta">Upgrade plan</button>
            <span class="q-outline" aria-hidden="true" />
            <span ref="badgeAEl" class="q-badge" :data-note="notes.a !== ''">1</span>
          </div>

          <div class="pickable">
            <div class="stat">
              <p class="stat-k">Churn</p>
              <p class="stat-v">1.8%</p>
              <span class="spark" />
            </div>
            <span class="q-outline" aria-hidden="true" />
            <span ref="badgeBEl" class="q-badge" :data-note="notes.b !== ''">2</span>
          </div>

          <!-- 1:1 with the editor in packages/core/src/overlay.ts. -->
          <div class="note-editor" :data-open="open !== null" :data-for="open ?? 'a'">
            <h3>Note for PICK {{ openId }}</h3>
            <div class="box" :data-empty="draft === ''">
              <span v-if="draft === ''" class="placeholder">
                What should the agent do with this element?
              </span>
              <span v-else>{{ draft }}</span>
              <span v-if="typing" class="caret" aria-hidden="true" />
            </div>
            <div class="row">
              <span class="hint">Enter saves · Shift+Enter for a line break</span>
              <button type="button" class="danger">Remove pick</button>
            </div>
          </div>
        </div>
      </div>

      <!-- What the notes are for. -->
      <div class="agent">
        <div class="agent-head">
          <span class="agent-dot" />
          <span class="agent-name">your coding agent</span>
          <span class="agent-tag">reads .quello/picks.json</span>
        </div>

        <div class="agent-body">
          <p class="ask" :data-shown="asked">
            <span class="caret-mark">›</span> resolve the picks
          </p>

          <ol class="steps">
            <li
              v-for="(step, index) in STEPS"
              :key="step.id"
              class="step"
              :data-shown="index < shownSteps"
              :data-done="index < doneSteps"
            >
              <span class="step-n">{{ step.id }}</span>
              <div class="step-body">
                <p class="step-where">{{ step.where }}</p>
                <p class="step-note">“{{ step.note }}”</p>
              </div>
              <span class="step-mark" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.5 12.5 10 18 19.5 6.5"
                    stroke="currentColor"
                    stroke-width="2.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </li>
          </ol>

          <p class="foot">
            Picks without a note are bookmarks — the agent leaves those alone.
          </p>
        </div>
      </div>

      <span
        class="cursor"
        :data-shown="cursor.shown"
        :data-click="clicking"
        :style="{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }"
        aria-hidden="true"
      >
        <span class="ring" />
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
          <path
            d="M3 1.6 3 17.4 7.1 13.6 9.9 20.2 12.9 18.9 10.1 12.5 15.6 12.2 Z"
            fill="#fff"
            stroke="#17191c"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>
  </div>
</template>

<style scoped>
.notes-scene {
  --ink: #17191c;
  --ink-deep: #0e1013;
  --line: #2a2d33;
  --amber: #e09000;
  --amber-bright: #ffb020;
  --sky: #5ec2f2;
  --paper: #faf9f7;
  --paper-line: #e7e3dd;
  --paper-ink: #2c2a26;
  --paper-mute: #8b857c;

  /* Sits in the section's `#bottom` slot, outside its container, so it gets the
     same width as the hero's scene instead of the prose measure. */
  margin: 0 auto;
  padding: 0 1rem;
  max-width: 72rem;
}

.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: stretch;
}

/* --- the page the picks were made on ------------------------------------ */

.surface {
  position: relative;
  padding: 16px 18px 22px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--paper);
  box-shadow: 0 24px 50px -26px rgba(0, 0, 0, 0.7);
}

.surface-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--paper-line);
}
.surface-name {
  color: var(--paper-ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.surface-tag {
  color: var(--paper-mute);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.targets {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 20px;
  margin-top: 26px;
  /* Room for the editor, which floats under whichever badge is open. Reserved so
     the panel keeps one height through the whole loop. */
  padding-bottom: 200px;
}

.cta {
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: var(--amber-bright);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.stat {
  padding: 12px 13px 14px;
  border: 1px solid var(--paper-line);
  border-radius: 10px;
  background: #fff;
}
.stat-k {
  margin: 0;
  color: var(--paper-mute);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.stat-v {
  margin: 5px 0 0;
  color: var(--paper-ink);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.spark {
  display: block;
  height: 3px;
  margin-top: 10px;
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(94, 194, 242, 0.8), rgba(94, 194, 242, 0.12));
}

/* --- quello's marks ------------------------------------------------------ */

.pickable {
  position: relative;
}
.q-outline {
  position: absolute;
  inset: -5px;
  border: 1.5px dashed rgba(224, 144, 0, 0.85);
  border-radius: 5px;
  pointer-events: none;
}

.q-badge {
  position: absolute;
  top: -16px;
  right: -13px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border: 2px solid #fff;
  border-radius: 11px;
  background: var(--amber);
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  transition: border-color 200ms linear;
}
/* A pick carrying a note is marked, so notes are visible without opening them. */
.q-badge[data-note='true'] {
  border-color: var(--sky);
}
.q-badge[data-note='true']::before {
  content: '';
  position: absolute;
  top: -3px;
  right: -3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sky);
  animation: pop 220ms cubic-bezier(0.2, 1.5, 0.4, 1);
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* --- the note editor ----------------------------------------------------- */

.note-editor {
  position: absolute;
  top: calc(100% - 186px);
  width: 264px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--ink);
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 160ms linear, transform 160ms ease;
  pointer-events: none;
}
.note-editor[data-open='true'] {
  opacity: 1;
  transform: translateY(0);
}
.note-editor[data-for='a'] {
  left: 0;
}
.note-editor[data-for='b'] {
  right: 0;
}
.note-editor h3 {
  margin: 0 0 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.5;
}
.note-editor .box {
  min-height: 66px;
  padding: 7px 9px;
  border: 1px solid #373b41;
  border-radius: 7px;
  background: var(--ink-deep);
  color: #fff;
  font-size: 12px;
  line-height: 1.5;
}
.note-editor[data-open='true'] .box {
  border-color: var(--amber-bright);
}
.note-editor .placeholder {
  opacity: 0.38;
}
.caret {
  display: inline-block;
  width: 1px;
  height: 13px;
  margin-left: 1px;
  translate: 0 2px;
  background: var(--amber-bright);
  animation: blink 900ms steps(2, start) infinite;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
.note-editor .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
.note-editor .hint {
  font-size: 10px;
  opacity: 0.4;
  line-height: 1.4;
}
.note-editor .danger {
  padding: 5px 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #ef4444;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

/* --- the agent ----------------------------------------------------------- */

.agent {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--ink-deep);
  box-shadow: 0 24px 50px -26px rgba(0, 0, 0, 0.75);
  overflow: hidden;
}

.agent-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--ink);
}
.agent-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sky);
  box-shadow: 0 0 0 3px rgba(94, 194, 242, 0.15);
}
.agent-name {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.agent-tag {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.35);
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.agent-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px 14px 14px;
}

.ask {
  margin: 0 0 16px;
  padding: 9px 12px;
  border: 1px solid rgba(255, 176, 32, 0.28);
  border-radius: 9px;
  background: rgba(255, 176, 32, 0.08);
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 280ms ease-out, transform 280ms ease-out;
}
.ask[data-shown='true'] {
  opacity: 1;
  transform: translateY(0);
}
.caret-mark {
  margin-right: 6px;
  color: var(--amber-bright);
}

.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 20px;
  gap: 10px;
  align-items: start;
  padding: 10px 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 300ms ease-out, transform 300ms ease-out, border-color 300ms linear;
}
.step[data-shown='true'] {
  opacity: 1;
  transform: translateY(0);
}
.step[data-done='true'] {
  border-color: rgba(94, 194, 242, 0.35);
}

/* Quiet by default: the number identifies the row, it does not need to shout. */
.step-n {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid rgba(255, 176, 32, 0.45);
  background: rgba(255, 176, 32, 0.16);
  color: #ffc266;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.step-body {
  min-width: 0;
}
.step-where {
  margin: 0;
  color: rgba(255, 255, 255, 0.45);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.step-note {
  margin: 3px 0 0;
  color: #fff;
  font-size: 12.5px;
  line-height: 1.45;
}
.step-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--sky);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 220ms ease-out, transform 220ms cubic-bezier(0.2, 1.5, 0.4, 1);
}
.step[data-done='true'] .step-mark {
  opacity: 1;
  transform: scale(1);
}

.foot {
  margin: auto 0 0;
  padding-top: 14px;
  color: rgba(255, 255, 255, 0.38);
  font-size: 11.5px;
  line-height: 1.5;
}

/* --- the pointer --------------------------------------------------------- */

.cursor {
  position: absolute;
  top: 0;
  left: 0;
  margin: -2px 0 0 -3px;
  opacity: 0;
  transition: transform 620ms cubic-bezier(0.4, 0, 0.15, 1), opacity 220ms linear;
  pointer-events: none;
  z-index: 5;
}
.cursor[data-shown='true'] {
  opacity: 1;
}
.cursor svg {
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
}
.ring {
  position: absolute;
  top: -9px;
  left: -9px;
  width: 26px;
  height: 26px;
  border: 2px solid var(--amber-bright);
  border-radius: 50%;
  opacity: 0;
}
.cursor[data-click='true'] .ring {
  animation: tap 320ms ease-out;
}
@keyframes tap {
  from {
    opacity: 0.9;
    transform: scale(0.3);
  }
  to {
    opacity: 0;
    transform: scale(1.25);
  }
}

@media (max-width: 1023px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 479px) {
  .targets {
    grid-template-columns: minmax(0, 1fr);
    gap: 26px;
  }
  .note-editor {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor,
  .caret,
  .ring,
  .q-badge[data-note='true']::before {
    animation: none !important;
    transition: none !important;
  }
}
</style>

<style>
/* Same reasoning as HeroDemo's global block: the gap under the section's copy
   belongs to the scene, and a Tailwind utility written in Markdown would generate
   no rule at all. Gated on `.quello-notes`, which exists only on the homepage. */
main:has(.quello-notes) [data-slot='container']:has(+ .quello-notes) {
  padding-bottom: 2.25rem;
}
</style>
