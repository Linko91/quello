import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { NextResponse } from 'next/server'
import type { QuelloPick, QuelloPicksFile } from '@quello/core'

/** Mirrors what the Vite plugin's middleware does, for a framework without Vite. */
const FILE = resolve(process.cwd(), '.quello/picks.json')

const empty = (): QuelloPicksFile => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  picks: [],
})

function normalize(input: unknown): QuelloPicksFile {
  const picks = (input as QuelloPicksFile | undefined)?.picks
  const valid = Array.isArray(picks)
    ? picks.filter((p): p is QuelloPick => typeof p?.id === 'number' && typeof p?.selector === 'string')
    : []
  return { version: 1, updatedAt: new Date().toISOString(), picks: [...valid].sort((a, b) => a.id - b.id) }
}

export async function GET() {
  try {
    return NextResponse.json(normalize(JSON.parse(await readFile(FILE, 'utf8'))))
  } catch {
    return NextResponse.json(empty())
  }
}

export async function POST(request: Request) {
  const payload = normalize(await request.json())
  await mkdir(dirname(FILE), { recursive: true })
  await writeFile(FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return NextResponse.json({ ok: true, count: payload.picks.length })
}
