/**
 * Shared picks for the tests.
 *
 * `bare` is the important one: the store only insists on `id` and `selector`, so
 * a pick with nothing else is a legal input and every formatter has to survive it.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { QuelloPick, QuelloPicksFile } from '@quello/core'

export const buyButton: QuelloPick = {
  id: 1,
  label: 'Buy now',
  selector: '.cta > button',
  domPath: 'body > div#app > main > button.cta',
  tag: 'button',
  classes: ['cta', 'cta--primary'],
  attributes: { type: 'button', 'aria-label': 'Buy now', disabled: '' },
  text: 'Buy now',
  rect: { x: 12, y: 220, width: 320, height: 44, top: 220, left: 12, right: 332, bottom: 264 },
  style: {
    display: 'flex',
    font: '14px/20px',
    fontWeight: '600',
    color: 'rgb(255, 255, 255)',
    background: 'rgb(224, 144, 0)',
    padding: '8px 16px',
    margin: '0px',
    gap: '8px',
    borderRadius: '6px',
  },
  framework: {
    framework: 'vue',
    component: 'BuyButton',
    file: 'src/components/BuyButton.vue',
    line: 12,
  },
  page: { url: 'http://localhost:5173/checkout', title: 'Checkout' },
  pickedAt: '2026-09-03T09:59:00.000Z',
}

/** Carries a note, so it is one of the picks `resolve_picks` works through. */
export const sidebar: QuelloPick = {
  id: 2,
  label: 'Sidebar',
  note: 'make this sticky on scroll',
  selector: 'aside.sidebar',
  domPath: 'body > div#app > aside.sidebar',
  tag: 'aside',
  classes: ['sidebar'],
  attributes: {},
  text: 'Filters',
  rect: { x: 0, y: 80, width: 240, height: 600, top: 80, left: 0, right: 240, bottom: 680 },
  style: {
    display: 'block',
    font: '16px/24px',
    fontWeight: '400',
    color: 'rgb(20, 20, 20)',
    background: 'rgb(250, 250, 250)',
    padding: '16px',
    margin: '0px',
    gap: '',
    borderRadius: '0px',
  },
  framework: { framework: 'svelte', component: 'Sidebar', file: 'src/Sidebar.svelte', line: 3, column: 5 },
  page: { url: 'http://localhost:5173/settings', title: 'Settings' },
  pickedAt: '2026-09-03T10:00:00.000Z',
}

/** Everything the store does not insist on, left out. */
export const bare = { id: 3, selector: '#footer' } as QuelloPick

export const allPicks: QuelloPick[] = [buyButton, sidebar, bare]

export function picksFile(picks: QuelloPick[] = allPicks): QuelloPicksFile {
  return { version: 1, updatedAt: '2026-09-03T10:00:00.000Z', picks }
}

/** Write a picks file under `root` and return its path. */
export async function writePicksFixture(
  root: string,
  picks: QuelloPick[] = allPicks,
  relative = '.quello/picks.json',
): Promise<string> {
  const path = join(root, relative)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(picksFile(picks), null, 2)}\n`, 'utf8')
  return path
}
