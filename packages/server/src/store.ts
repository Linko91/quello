import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import type { QuelloPick, QuelloPicksFile } from '@quello/core'

export const DEFAULT_PICKS_FILE = '.quello/picks.json'

export function resolvePicksPath(root: string, picksFile: string): string {
  return isAbsolute(picksFile) ? picksFile : resolve(root, picksFile)
}

function isPick(value: unknown): value is QuelloPick {
  if (!value || typeof value !== 'object') return false
  const pick = value as Partial<QuelloPick>
  return typeof pick.id === 'number' && typeof pick.selector === 'string'
}

/** Accept only well-formed picks and keep them in a stable, id-ascending order. */
export function normalize(input: unknown): QuelloPicksFile {
  const picks = Array.isArray((input as QuelloPicksFile | undefined)?.picks)
    ? (input as QuelloPicksFile).picks.filter(isPick)
    : []
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    picks: [...picks].sort((a, b) => a.id - b.id),
  }
}

export async function readPicks(path: string): Promise<QuelloPicksFile> {
  try {
    const raw = await readFile(path, 'utf8')
    return normalize(JSON.parse(raw))
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), picks: [] }
  }
}

export async function writePicks(path: string, payload: QuelloPicksFile): Promise<QuelloPicksFile> {
  const normalized = normalize(payload)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  return normalized
}
