import type { QuelloPick, QuelloPicksFile } from './types'

/** Talks to the dev-server middleware added by vite-plugin-quello. */
export class PicksTransport {
  constructor(private readonly endpoint: string | null) {}

  async load(): Promise<QuelloPick[]> {
    if (!this.endpoint) return []
    try {
      const response = await fetch(this.endpoint, { headers: { accept: 'application/json' } })
      if (!response.ok) return []
      const data = (await response.json()) as Partial<QuelloPicksFile>
      return Array.isArray(data.picks) ? data.picks : []
    } catch {
      return []
    }
  }

  async save(picks: QuelloPick[]): Promise<void> {
    if (!this.endpoint) return
    const payload: QuelloPicksFile = {
      version: 1,
      updatedAt: new Date().toISOString(),
      picks,
    }
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // Persistence is best-effort: the picker keeps working without a dev server.
    }
  }
}
