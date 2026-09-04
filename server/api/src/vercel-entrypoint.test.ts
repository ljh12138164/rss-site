import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const vercelEntrypointCandidates = [
  'app.ts',
  'index.ts',
  'server.ts',
  'main.ts',
  'src/app.ts',
  'src/index.ts',
  'src/server.ts',
  'src/main.ts'
]

describe('Vercel Hono entrypoint', () => {
  it('keeps src/index.ts as the first matching entrypoint', () => {
    const detectedEntrypoint = vercelEntrypointCandidates.find((candidate) => existsSync(candidate))

    expect(detectedEntrypoint).toBe('src/index.ts')
  })
})
