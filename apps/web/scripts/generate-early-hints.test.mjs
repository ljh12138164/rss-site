import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildLinkHeaderValue,
  findCssChunks,
  injectEarlyHints,
  PLACEHOLDER,
  updateManifestFile
} from './generate-early-hints.mjs'

describe('generate-early-hints', () => {
  let tmpDir

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'early-hints-test-'))
  })

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  it('formats Link header value correctly for css files', () => {
    const header = buildLinkHeaderValue(['app-123.css', 'chunk-456.css'])
    expect(header).toBe(
      '</_next/static/chunks/app-123.css>; rel=preload; as=style, </_next/static/chunks/chunk-456.css>; rel=preload; as=style'
    )
  })

  it('finds and sorts css chunks while ignoring sourcemaps', async () => {
    const chunksDir = path.join(tmpDir, 'static', 'chunks')
    await mkdir(chunksDir, { recursive: true })
    await writeFile(path.join(chunksDir, 'b.css'), '/* b */')
    await writeFile(path.join(chunksDir, 'a.css'), '/* a */')
    await writeFile(path.join(chunksDir, 'a.css.map'), '{}')
    await writeFile(path.join(chunksDir, 'c.js'), 'console.log()')

    const cssFiles = await findCssChunks(tmpDir)
    expect(cssFiles).toEqual(['a.css', 'b.css'])
  })

  it('replaces placeholder in routes-manifest.json', async () => {
    const manifestPath = path.join(tmpDir, 'routes-manifest.json')
    const initialManifest = {
      version: 3,
      headers: [
        {
          source: '/:path*',
          headers: [{ key: 'Link', value: PLACEHOLDER }]
        }
      ]
    }
    await writeFile(manifestPath, JSON.stringify(initialManifest), 'utf8')

    const updated = await updateManifestFile(
      manifestPath,
      '</_next/static/chunks/main.css>; rel=preload; as=style'
    )
    expect(updated).toBe(true)

    const result = JSON.parse(await readFile(manifestPath, 'utf8'))
    expect(result.headers[0].headers[0].value).toBe(
      '</_next/static/chunks/main.css>; rel=preload; as=style'
    )
  })

  it('inserts Link header rule if no placeholder exists', async () => {
    const manifestPath = path.join(tmpDir, 'routes-manifest.json')
    const initialManifest = {
      version: 3,
      headers: []
    }
    await writeFile(manifestPath, JSON.stringify(initialManifest), 'utf8')

    const updated = await updateManifestFile(
      manifestPath,
      '</_next/static/chunks/main.css>; rel=preload; as=style'
    )
    expect(updated).toBe(true)

    const result = JSON.parse(await readFile(manifestPath, 'utf8'))
    expect(result.headers).toHaveLength(1)
    expect(result.headers[0].headers[0].key).toBe('Link')
    expect(result.headers[0].headers[0].value).toBe(
      '</_next/static/chunks/main.css>; rel=preload; as=style'
    )
  })

  it('removes rule if no css chunks found', async () => {
    const manifestPath = path.join(tmpDir, 'routes-manifest.json')
    const initialManifest = {
      version: 3,
      headers: [
        {
          source: '/:path*',
          headers: [{ key: 'Link', value: PLACEHOLDER }]
        },
        {
          source: '/other',
          headers: [{ key: 'X-Other', value: '1' }]
        }
      ]
    }
    await writeFile(manifestPath, JSON.stringify(initialManifest), 'utf8')

    const updated = await updateManifestFile(manifestPath, '')
    expect(updated).toBe(true)

    const result = JSON.parse(await readFile(manifestPath, 'utf8'))
    expect(result.headers).toHaveLength(1)
    expect(result.headers[0].source).toBe('/other')
  })

  it('injects early hints across both root and standalone manifests', async () => {
    const chunksDir = path.join(tmpDir, 'static', 'chunks')
    await mkdir(chunksDir, { recursive: true })
    await writeFile(path.join(chunksDir, 'style.css'), 'body{}')

    const rootManifest = path.join(tmpDir, 'routes-manifest.json')
    const standaloneDir = path.join(tmpDir, 'standalone', 'apps', 'web', '.next')
    await mkdir(standaloneDir, { recursive: true })
    const standaloneManifest = path.join(standaloneDir, 'routes-manifest.json')

    const template = {
      version: 3,
      headers: [{ source: '/:path*', headers: [{ key: 'Link', value: PLACEHOLDER }] }]
    }
    await writeFile(rootManifest, JSON.stringify(template))
    await writeFile(standaloneManifest, JSON.stringify(template))

    const { updatedCount, linkValue } = await injectEarlyHints(tmpDir)
    expect(updatedCount).toBe(2)
    expect(linkValue).toBe('</_next/static/chunks/style.css>; rel=preload; as=style')

    const rootResult = JSON.parse(await readFile(rootManifest, 'utf8'))
    const standaloneResult = JSON.parse(await readFile(standaloneManifest, 'utf8'))
    expect(rootResult.headers[0].headers[0].value).toBe(linkValue)
    expect(standaloneResult.headers[0].headers[0].value).toBe(linkValue)
  })
})
