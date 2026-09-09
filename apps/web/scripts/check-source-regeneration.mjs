import assert from 'node:assert/strict'
import { rename } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Run against a fresh production server after build. Simulate an evicted HTML
// cache entry without changing the route manifest or the generated RSC payload.
const origin = process.argv[2] ?? 'http://localhost:3107'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
const paths = [
  '/ai/openai',
  '/technology/github',
  '/news/xinhua',
  '/social/bilibili',
  '/finance/wallstreetcn',
  '/games/3dmgame'
]
const failures = []
for (const path of paths) {
  const html = fileURLToPath(new URL(`../.next/server/app${path}.html`, import.meta.url))
  const backup = `${html}.regression-backup`
  await rename(html, backup)
  try {
    const response = await fetch(new URL(path, origin))
    const body = await response.text()
    console.log(`${path}: ${response.status}`)
    // The RSC payload also serializes the unused not-found boundary.
    if (response.status !== 200 || /<h1\b[^>]*>这里没有热点<\/h1>/.test(body)) failures.push(path)
  } finally {
    await rename(backup, html)
  }
}
assert.deepEqual(failures, [], 'Known sources must regenerate after a cache miss')
for (const path of paths) {
  const section = path.split('/')[1]
  const response = await fetch(new URL(`/${section}/unknown-source`, origin))
  await response.body?.cancel()
  assert.equal(response.status, 404, `${section} must reject unknown sources`)
}
