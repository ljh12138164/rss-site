import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSW } from 'workbox-build'

export const MONETAG_SW_SNIPPET = `self.options = {
    "domain": "3nbf4.com",
    "zoneId": 12146646
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')`

export async function injectMonetagSnippet(swPath) {
  const content = await fs.readFile(swPath, 'utf8')
  if (!content.includes('3nbf4.com')) {
    await fs.writeFile(swPath, `${MONETAG_SW_SNIPPET}\n${content}`, 'utf8')
  }
}

// These callbacks must be self-contained: Workbox serializes them into sw.js.
export function matchesPublicPage({ request, url, sameOrigin }) {
  return (
    sameOrigin &&
    request.method === 'GET' &&
    request.mode === 'navigate' &&
    !request.headers.has('RSC') &&
    !url.searchParams.has('_rsc') &&
    (url.pathname === '/' ||
      /^\/(ai|technology|news|social|finance|games|github|skills|about|privacy|mcp)(\/|$)/.test(
        url.pathname
      ))
  )
}

export function matchesStaticAsset({ request, url, sameOrigin }) {
  return (
    sameOrigin &&
    request.method === 'GET' &&
    url.pathname.startsWith('/_next/static/') &&
    ['script', 'style', 'font'].includes(request.destination)
  )
}

export async function cachePublicHtml({ response }) {
  return response.status === 200 &&
    response.headers.get('Content-Type')?.includes('text/html') &&
    !/no-store|private/i.test(response.headers.get('Cache-Control') ?? '')
    ? response
    : null
}

export function serviceWorkerConfig(webDir) {
  return {
    globDirectory: path.join(webDir, 'public'),
    globPatterns: ['offline.html'],
    swDest: path.join(webDir, 'public/sw.js'),
    inlineWorkboxRuntime: true,
    sourcemap: false,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    // Let existing tabs finish with their current worker before activating updates.
    skipWaiting: false,
    runtimeCaching: [
      {
        urlPattern: matchesPublicPage,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'rss-public-pages-v1',
          plugins: [{ cacheWillUpdate: cachePublicHtml }],
          expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
          precacheFallback: { fallbackURL: '/offline.html' }
        }
      },
      {
        urlPattern: matchesStaticAsset,
        handler: 'CacheFirst',
        options: {
          cacheName: 'rss-static-v1',
          cacheableResponse: { statuses: [200] },
          expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 }
        }
      }
    ]
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const webDir = fileURLToPath(new URL('../', import.meta.url))
  const swPath = path.join(webDir, 'public/sw.js')
  const { count, size, warnings } = await generateSW(serviceWorkerConfig(webDir))
  if (warnings.length) throw new Error(warnings.join('\n'))
  await injectMonetagSnippet(swPath)
  console.log(`Generated sw.js: ${count} precached file, ${size} bytes`)
}
