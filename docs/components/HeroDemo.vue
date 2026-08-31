<script setup lang="ts">
/**
 * The homepage's centrepiece: quello's real toolbar, driven through a loop of the
 * thing it does — arm the picker, hover an element, click it, watch the pick land
 * in `.quello/picks.json`.
 *
 * Every colour and measurement here is copied from `@quello/core`'s own stylesheet
 * (`packages/core/src/overlay.ts`), so the demo ages with the product rather than
 * drifting into a prettier lie. The outlines, tip and badges are children of the
 * elements they mark instead of absolutely-placed boxes, which is what keeps the
 * scene correct at every width without measuring anything. Only the cursor is
 * measured, because it is the one thing that travels between elements.
 */

interface Target {
  key: 'a' | 'b'
  tip: string
  selector: string
  text: string
  component: string
  file: string
  line: number
}

const TARGETS: Target[] = [
  {
    key: 'a',
    tip: '<button> · PricingCta',
    selector: 'button.cta',
    text: 'Upgrade plan',
    component: 'PricingCta',
    file: 'src/components/PricingCta.vue',
    line: 42,
  },
  {
    key: 'b',
    tip: '<div> · StatCard',
    selector: 'div.stat--churn',
    text: 'Churn 1.8%',
    component: 'StatCard',
    file: 'src/components/StatCard.vue',
    line: 18,
  },
]

const stage = ref<HTMLElement | null>(null)
const primaryEl = ref<HTMLElement | null>(null)
const targetAEl = ref<HTMLElement | null>(null)
const targetBEl = ref<HTMLElement | null>(null)

const picking = ref(false)
const hovered = ref<'a' | 'b' | null>(null)
/** Picked targets, in the order they were picked — the index is the PICK number. */
const picked = ref<Array<'a' | 'b'>>(['a', 'b'])
const cursor = ref({ x: 0, y: 0, shown: false })
const clicking = ref(false)

/** Which element the cursor is parked on, so a resize can re-measure it. */
let anchor: HTMLElement | null = null
let timers: ReturnType<typeof setTimeout>[] = []
let observer: IntersectionObserver | null = null
let resizer: ResizeObserver | null = null
let running = false

const pickedRows = computed(() =>
  picked.value.map((key, index) => {
    const target = TARGETS.find(t => t.key === key)!
    return { ...target, id: index + 1 }
  }),
)

const countLabel = computed(() =>
  picked.value.length === 1 ? '1 pick' : `${picked.value.length} picks`,
)

function pickNumber(key: 'a' | 'b'): number | null {
  const index = picked.value.indexOf(key)
  return index === -1 ? null : index + 1
}

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

function settled(): void {
  picking.value = false
  hovered.value = null
  picked.value = ['a', 'b']
  cursor.value = { ...cursor.value, shown: false }
}

/** One pass of the story. Times are cumulative milliseconds from the pass's start. */
function play(): void {
  if (!running) return
  // Every timer from the previous pass has fired by the time it schedules this one,
  // so the list is cleared rather than appended to — otherwise a page left open all
  // afternoon accumulates a few thousand dead handles.
  timers = []
  const at = (ms: number, step: () => void) => timers.push(setTimeout(step, ms))

  at(0, () => {
    picking.value = false
    hovered.value = null
    picked.value = []
    moveTo(primaryEl.value)
  })
  at(900, () => tap())
  at(1000, () => (picking.value = true))
  at(1600, () => moveTo(targetAEl.value))
  at(2200, () => (hovered.value = 'a'))
  at(3000, () => tap())
  at(3100, () => {
    picked.value = ['a']
    hovered.value = null
  })
  at(3700, () => moveTo(targetBEl.value))
  at(4300, () => (hovered.value = 'b'))
  at(5100, () => tap())
  at(5200, () => {
    picked.value = ['a', 'b']
    hovered.value = null
  })
  at(6000, () => moveTo(primaryEl.value))
  at(6700, () => tap())
  at(6800, () => (picking.value = false))
  at(9800, () => play())
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
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settled()
    return
  }

  resizer = new ResizeObserver(() => place())
  if (stage.value) resizer.observe(stage.value)

  // The server renders the finished state, so the scene is never a blank frame for
  // a reader who arrives mid-load or with JavaScript off. Hold it a beat, then run.
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
    }, 1200),
  )
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
  resizer?.disconnect()
})
</script>

<template>
  <div class="scene quello-scene">
    <div class="glow" aria-hidden="true" />

    <div ref="stage" class="stage">
      <!-- The app under inspection. Light, so the dark toolbar reads as something
           laid over it rather than as part of it. -->
      <div class="window">
        <div class="chrome">
          <span class="dot" /><span class="dot" /><span class="dot" />
          <span class="url">localhost:5173</span>
          <span class="badge-dev">dev only</span>
        </div>

        <div class="app">
          <aside class="rail">
            <span class="rail-mark" />
            <span class="rail-item is-on" />
            <span class="rail-item" />
            <span class="rail-item" />
            <span class="rail-item" />
          </aside>

          <div class="main">
            <header class="app-head">
              <div>
                <p class="crumb">Workspace</p>
                <h3 class="app-title">Billing</h3>
              </div>

              <div
                ref="targetAEl"
                class="pickable"
                :data-hover="hovered === 'a'"
                :data-picked="pickNumber('a') !== null"
              >
                <button type="button" class="cta">Upgrade plan</button>
                <span class="q-outline" aria-hidden="true" />
                <span v-if="hovered === 'a'" class="q-tip">{{ TARGETS[0].tip }}</span>
                <span v-if="pickNumber('a')" class="q-badge">{{ pickNumber('a') }}</span>
              </div>
            </header>

            <div class="stats">
              <div class="stat">
                <p class="stat-k">MRR</p>
                <p class="stat-v">$48.2k</p>
                <span class="spark" />
              </div>

              <div
                ref="targetBEl"
                class="pickable"
                :data-hover="hovered === 'b'"
                :data-picked="pickNumber('b') !== null"
              >
                <div class="stat">
                  <p class="stat-k">Churn</p>
                  <p class="stat-v">1.8%</p>
                  <span class="spark spark--down" />
                </div>
                <span class="q-outline" aria-hidden="true" />
                <span v-if="hovered === 'b'" class="q-tip">{{ TARGETS[1].tip }}</span>
                <span v-if="pickNumber('b')" class="q-badge">{{ pickNumber('b') }}</span>
              </div>

              <div class="stat">
                <p class="stat-k">Seats</p>
                <p class="stat-v">126</p>
                <span class="spark" />
              </div>
            </div>

            <div class="rows">
              <div v-for="n in 2" :key="n" class="row">
                <span class="row-a" />
                <span class="row-b" />
                <span class="row-c" />
              </div>
            </div>
          </div>
        </div>

        <!-- quello's toolbar, as `@quello/core` draws it: docked bottom-right. -->
        <div class="dock">
          <div class="toolbar">
            <span class="grip" aria-hidden="true">⠿</span>

            <button ref="primaryEl" type="button" class="q-btn primary" :data-on="picking">
              <span v-if="picking">picking…</span>
              <svg
                v-else
                width="61"
                height="17"
                viewBox="0 0 86 24"
                fill="none"
                aria-hidden="true"
              >
                <g
                  stroke="currentColor"
                  stroke-width="2.9"
                  stroke-linecap="square"
                  stroke-linejoin="round"
                >
                  <circle cx="8.6" cy="8.6" r="6" />
                  <path d="M14.6 8.6 V21.9" />
                  <path d="M21 2.6 V8.6 A6 6 0 0 0 33 8.6 V2.6" />
                  <path d="M33 8.6 V14.6" />
                  <path d="M50.2 12.5 A6 6 0 1 1 51.6 8.6 H39.6" />
                  <path d="M58.2 1.6 V14.6" />
                  <path d="M64 1.6 V14.6" />
                  <circle cx="76.4" cy="8.6" r="6" />
                </g>
                <circle cx="8.6" cy="8.6" r="2" fill="currentColor" />
              </svg>
            </button>

            <button v-show="picked.length" type="button" class="q-btn count">
              <span class="count-label">{{ countLabel }}</span>
              <span class="chev" aria-hidden="true">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 9.5 12 15.5 18 9.5" />
                </svg>
              </span>
            </button>

            <button type="button" class="q-btn icon" aria-label="Settings">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="4.4" stroke-width="2.1" />
                <g stroke-width="3" stroke-linecap="butt">
                  <path d="M12 5.9V3.7" /><path d="M12 18.1v2.2" />
                  <path d="M5.9 12H3.7" /><path d="M18.1 12h2.2" />
                  <path d="M7.68 7.68 6.13 6.13" /><path d="M16.32 16.32l1.55 1.55" />
                  <path d="M16.32 7.68l1.55-1.55" /><path d="M7.68 16.32l-1.55 1.55" />
                </g>
              </svg>
            </button>

            <button type="button" class="q-btn icon" aria-label="Collapse the toolbar">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M6 12h12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- The pointer. The only thing in the scene whose position is measured. -->
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

      <!-- What the agent actually reads. -->
      <div class="file">
        <div class="file-head">
          <span class="file-dot" />
          <span class="file-name">.quello/picks.json</span>
          <span class="file-tag">written on every pick</span>
        </div>

        <pre class="json"><code><span class="p">{</span>
  <span class="k">"version"</span><span class="p">:</span> <span class="n">1</span><span class="p">,</span>
  <span class="k">"picks"</span><span class="p">:</span> <span class="p">[</span><template v-for="row in pickedRows" :key="row.id">
    <span class="p">{</span>
      <span class="k">"id"</span><span class="p">:</span> <span class="n">{{ row.id }}</span><span class="p">,</span>
      <span class="k">"label"</span><span class="p">:</span> <span class="s">"PICK {{ row.id }}"</span><span class="p">,</span>
      <span class="k">"selector"</span><span class="p">:</span> <span class="s">"{{ row.selector }}"</span><span class="p">,</span>
      <span class="k">"text"</span><span class="p">:</span> <span class="s">"{{ row.text }}"</span><span class="p">,</span>
      <span class="k">"framework"</span><span class="p">:</span> <span class="p">{</span> <span class="k">"component"</span><span class="p">:</span> <span class="s">"{{ row.component }}"</span><span class="p">,</span>
                     <span class="k">"file"</span><span class="p">:</span> <span class="s">"{{ row.file }}"</span><span class="p">,</span>
                     <span class="k">"line"</span><span class="p">:</span> <span class="n">{{ row.line }}</span> <span class="p">}</span>
    <span class="p">}</span><span class="p">{{ row.id === pickedRows.length ? '' : ',' }}</span></template>
  <span class="p">]</span>
<span class="p">}</span></code></pre>

        <!-- The payoff line only makes sense once there is a PICK 2 to point at, so
             it arrives with the second pick rather than sitting there ahead of it. -->
        <p class="say" :data-shown="picked.length > 1">
          <span class="say-q">“</span>make <b>PICK 2</b> a link instead<span class="say-q">”</span>
          <span class="say-tail">— and the agent knows which one.</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Straight from packages/core/src/overlay.ts and theme.ts. */
.scene {
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

  position: relative;
  /* Sits in the hero's `#bottom` slot, outside its container, so the scene gets its
     own width and its own breathing room above. */
  margin: 1.75rem auto 0;
  padding: 0 1rem;
  max-width: 78rem;
}

.glow {
  position: absolute;
  /* Kept inside the scene's own box: a negative horizontal inset widened the
     document on narrow viewports and gave the page a sideways scroll. */
  inset: -10% 0 6%;
  background:
    radial-gradient(48% 60% at 26% 22%, rgba(224, 144, 0, 0.16), transparent 70%),
    radial-gradient(42% 55% at 82% 78%, rgba(94, 194, 242, 0.08), transparent 72%);
  filter: blur(12px);
  pointer-events: none;
}

.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

/* --- the app window ------------------------------------------------------ */

.window {
  position: relative;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--paper);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 30px 60px -24px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

.chrome {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--paper-line);
  background: #f1eee9;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #d8d3cb;
}
.url {
  margin-left: 10px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #e6e1d9;
  color: var(--paper-mute);
  font-size: 10.5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.badge-dev {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid rgba(224, 144, 0, 0.35);
  border-radius: 999px;
  background: rgba(224, 144, 0, 0.12);
  color: #a86c00;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-right: 1px solid var(--paper-line);
  background: #f6f3ee;
}
.rail-mark {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: var(--paper-ink);
}
.rail-item {
  width: 20px;
  height: 6px;
  border-radius: 3px;
  background: #ddd7cd;
}
.rail-item.is-on {
  background: rgba(224, 144, 0, 0.55);
}

.main {
  padding: 18px 20px 22px;
}

.app-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}
.crumb {
  margin: 0;
  color: var(--paper-mute);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.app-title {
  margin: 2px 0 0;
  color: var(--paper-ink);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
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

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
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
  background: linear-gradient(90deg, rgba(224, 144, 0, 0.85), rgba(224, 144, 0, 0.15));
}
.spark--down {
  background: linear-gradient(90deg, rgba(94, 194, 242, 0.8), rgba(94, 194, 242, 0.12));
}

.rows {
  margin-top: 14px;
  border: 1px solid var(--paper-line);
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}
.row {
  display: grid;
  grid-template-columns: 1fr 3fr 1.2fr;
  gap: 12px;
  align-items: center;
  padding: 11px 13px;
}
.row + .row {
  border-top: 1px solid var(--paper-line);
}
.row span {
  height: 7px;
  border-radius: 4px;
  background: #ece7df;
}
.row-a {
  background: #ded8ce !important;
}
.row-c {
  justify-self: end;
  width: 46px;
}

/* --- quello's marks on the page ----------------------------------------- */

.pickable {
  position: relative;
}

.q-outline {
  position: absolute;
  inset: -5px;
  border-radius: 5px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms linear;
}
/* Hover: solid 2px in the hover colour, with the 12% fill derived from it. */
.pickable[data-hover='true'] .q-outline {
  opacity: 1;
  border: 2px solid var(--amber);
  background: color-mix(in srgb, var(--amber) 12%, transparent);
}
/* Picked: the dashed marker that stays behind once the element is in the file. */
.pickable[data-picked='true'] .q-outline {
  opacity: 1;
  border: 1.5px dashed rgba(224, 144, 0, 0.85);
  background: transparent;
}
.pickable[data-hover='true'][data-picked='true'] .q-outline {
  border: 2px solid var(--amber);
  background: color-mix(in srgb, var(--amber) 12%, transparent);
}

.q-tip {
  position: absolute;
  left: -5px;
  bottom: calc(100% + 7px);
  max-width: 320px;
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--amber);
  color: var(--ink);
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  pointer-events: none;
  animation: pop 140ms ease-out;
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
  animation: pop 220ms cubic-bezier(0.2, 1.5, 0.4, 1);
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* --- the toolbar, 1:1 with @quello/core --------------------------------- */

.dock {
  position: absolute;
  right: 16px;
  bottom: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}

.grip {
  padding: 0 4px 0 6px;
  font-size: 13px;
  line-height: 1;
  opacity: 0.35;
}

.q-btn {
  border: 0;
  border-radius: 999px;
  background: #2a2d33;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  font-family: inherit;
}
.q-btn.primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 83px;
  height: 31px;
  padding: 0 11px;
  transition: background-color 140ms linear, color 140ms linear;
}
.q-btn.primary svg {
  margin-top: 4px;
}
.q-btn.primary[data-on='true'] {
  background: var(--amber-bright);
  color: var(--ink);
}
.q-btn.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 31px;
  height: 31px;
  padding: 0;
  line-height: 0;
}
.q-btn.count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 31px;
  padding: 0 4px 0 6px;
  border-radius: 0;
  background: transparent;
  font-size: 11px;
  opacity: 0.65;
  white-space: nowrap;
}
.count-label {
  min-width: 52px;
  font-variant-numeric: tabular-nums;
  text-align: left;
}
.chev {
  display: flex;
  opacity: 0.55;
}

/* --- the pointer -------------------------------------------------------- */

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

/* --- the file ----------------------------------------------------------- */

.file {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--ink-deep);
  box-shadow: 0 24px 50px -24px rgba(0, 0, 0, 0.75);
  overflow: hidden;
}

.file-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--ink);
}
.file-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--amber-bright);
  box-shadow: 0 0 0 3px rgba(255, 176, 32, 0.15);
}
.file-name {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.file-tag {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.35);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.json {
  flex: 1;
  margin: 0;
  padding: 14px;
  overflow-x: auto;
  color: rgba(255, 255, 255, 0.75);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.65;
  tab-size: 2;
}
.json .k {
  color: #e8e6e3;
}
.json .s {
  color: var(--amber-bright);
}
.json .n {
  color: var(--sky);
}
.json .p {
  color: rgba(255, 255, 255, 0.3);
}

/* Held in the layout rather than removed from it: the card would otherwise change
   height on every pass of the loop, and the whole scene would twitch. */
.say {
  opacity: 0;
  transition: opacity 260ms ease-out;
  margin: 0;
  padding: 12px 14px 14px;
  border-top: 1px solid var(--line);
  color: rgba(255, 255, 255, 0.82);
  font-size: 12.5px;
  line-height: 1.55;
}
.say[data-shown='true'] {
  opacity: 1;
}
.say b {
  color: var(--amber-bright);
  font-weight: 700;
}
.say-q {
  color: rgba(255, 255, 255, 0.3);
}
.say-tail {
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 1023px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
  }
  .app {
    min-height: 0;
  }
}

@media (max-width: 639px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stats > :last-child {
    display: none;
  }
  .app-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor,
  .q-tip,
  .q-badge,
  .ring {
    animation: none !important;
    transition: none !important;
  }
}
</style>

<style>
/* These are global on purpose: they retune the Docus page shell the scene sits in,
   which a scoped style cannot reach. They are written here rather than as `ui:`
   classes in `content/index.md` because Tailwind never scans that file — a utility
   not already used elsewhere in the build produces no CSS at all, and the default
   silently stands. Every selector is gated on `.quello-scene`, which exists only on
   the homepage. */
/* Docus' section rhythm is built for prose pages, where 8rem of air above and
   below each block reads as calm. Stacked on a landing page whose sections are
   three lines long it reads as empty, so the homepage — and only the homepage,
   which is the only page this scene appears on — gets a tighter measure. */
main:has(.quello-scene) [data-slot='container'] {
  padding-top: 4.5rem;
  padding-bottom: 4.5rem;
}

/* The hero pads for a page that ends at its buttons. This one does not: the scene
   rides in the hero's `#bottom` slot, so the gap under the copy belongs to the
   scene. The `main` prefix is here only to outrank the rule above. */
main:has(.quello-scene) [data-slot='container']:has(+ .quello-scene) {
  padding-top: 3rem;
  padding-bottom: 2rem;
}
@media (min-width: 1024px) {
  main:has(.quello-scene) [data-slot='container']:has(+ .quello-scene) {
    padding-bottom: 2.25rem;
  }
}

/* Docus sizes the hero title for a page whose hero is the whole first screen. Here
   the scene has to share that screen, so the headline gives some of it back. */
main:has(.quello-scene) [data-slot='container']:has(+ .quello-scene) [data-slot='title'] {
  font-size: clamp(2.5rem, 5.2vw, 3.5rem);
  line-height: 1.04;
  letter-spacing: -0.03em;
}
main:has(.quello-scene) [data-slot='container']:has(+ .quello-scene) [data-slot='footer'] {
  margin-top: 1.75rem;
}
</style>
