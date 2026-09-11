import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const PLACEHOLDER = '__EARLY_HINTS_LINK_PLACEHOLDER__'
export const DEFAULT_SOURCE =
  '/((?!api|_next|favicon\\.ico|icon\\.svg|ads\\.txt|robots\\.txt|sitemap\\.xml|indexnow\\.txt).*)'
export const DEFAULT_REGEX =
  '^(?:/((?!api|_next|favicon\\.ico|icon\\.svg|ads\\.txt|robots\\.txt|sitemap\\.xml|indexnow\\.txt).*))(?:/)?$'

export async function findCssChunks(dotNextDir) {
  const chunksDir = path.join(dotNextDir, 'static', 'chunks')
  try {
    const entries = await readdir(chunksDir, { withFileTypes: true })
    const cssFiles = entries
      .filter(
        (entry) => entry.isFile() && entry.name.endsWith('.css') && !entry.name.endsWith('.css.map')
      )
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b))
    return cssFiles
  } catch {
    return []
  }
}

export function buildLinkHeaderValue(cssFiles) {
  return cssFiles.map((file) => `</_next/static/chunks/${file}>; rel=preload; as=style`).join(', ')
}

export async function updateManifestFile(manifestPath, linkValue) {
  try {
    const content = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(content)
    if (!manifest.headers || !Array.isArray(manifest.headers)) {
      manifest.headers = []
    }

    if (!linkValue) {
      manifest.headers = manifest.headers.filter((entry) => {
        return !entry.headers?.some((h) => h.key === 'Link')
      })
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
      return true
    }

    let found = false
    for (const entry of manifest.headers) {
      if (!entry.headers || !Array.isArray(entry.headers)) continue
      for (const h of entry.headers) {
        if (h.key === 'Link') {
          h.value = linkValue
          found = true
        }
      }
    }

    if (!found) {
      manifest.headers.unshift({
        source: DEFAULT_SOURCE,
        headers: [
          {
            key: 'Link',
            value: linkValue
          }
        ],
        regex: DEFAULT_REGEX
      })
    }

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

export async function injectEarlyHints(dotNextDir) {
  const cssFiles = await findCssChunks(dotNextDir)
  const linkValue = buildLinkHeaderValue(cssFiles)
  if (!linkValue) {
    console.warn('[early-hints] No CSS chunks found in', dotNextDir)
  } else {
    console.log('[early-hints] Found CSS chunks:', cssFiles.join(', '))
    console.log('[early-hints] Generated Link header:', linkValue)
  }

  const manifestPaths = [
    path.join(dotNextDir, 'routes-manifest.json'),
    path.join(dotNextDir, 'standalone', 'apps', 'web', '.next', 'routes-manifest.json')
  ]

  let updatedCount = 0
  for (const p of manifestPaths) {
    const ok = await updateManifestFile(p, linkValue)
    if (ok) {
      console.log(`[early-hints] Updated ${p}`)
      updatedCount++
    }
  }
  return { cssFiles, linkValue, updatedCount }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isDirectRun) {
  const dotNext = path.resolve(process.argv[2] || path.join(process.cwd(), '.next'))
  injectEarlyHints(dotNext).catch((err) => {
    console.error('[early-hints] Failed to inject early hints:', err)
    process.exit(1)
  })
}
