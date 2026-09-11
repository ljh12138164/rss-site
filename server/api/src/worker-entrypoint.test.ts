import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Cloudflare Worker deployment', () => {
  it('uses the Worker entrypoint and removes the Vercel deployment config', () => {
    const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8')) as {
      main: string
      hyperdrive: { binding: string }[]
    }

    expect(config.main).toBe('src/index.ts')
    expect(config.hyperdrive).toContainEqual(expect.objectContaining({ binding: 'HYPERDRIVE' }))
    expect(existsSync('vercel.json')).toBe(false)
  })
})
