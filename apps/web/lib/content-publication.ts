import { skillPath } from '../../../shared/skills'
import { validEventSlug } from './ai-events'
import { articleSource, parseArticleIdFromSlug } from './article-route'
import { parseArticleFilter } from './home-articles'

type StepStatus = 'succeeded' | 'failed' | 'disabled' | 'skipped'
interface StepResult {
  status: StepStatus
  httpStatus?: number
  attempts?: number
}

export function indexNowKey(): string | undefined {
  const key = process.env.INDEXNOW_KEY
  return key && /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : undefined
}

function validatePaths(paths: string[]): void {
  if (!paths.length || paths.length > 105) throw new Error('Invalid publication path')
  for (const path of paths) {
    if (path.startsWith('/skills/') && skillPath(path.slice(8)) === path) continue
    if (
      path === '/' ||
      path === '/sitemap.xml' ||
      path === '/ai/events' ||
      path === '/github' ||
      path === '/skills'
    )
      continue
    const articleParts = path.split('/')
    if (
      articleParts.length === 4 &&
      /^[a-z0-9-]+$/.test(articleParts[2]) &&
      /^[\p{L}\p{N}-]+$/u.test(articleParts[3]) &&
      parseArticleIdFromSlug(articleParts[3]) &&
      articleSource(articleParts[2])?.section.id === articleParts[1]
    )
      continue
    if (!/^\/[a-z0-9-]+(?:\/[a-z0-9-]+){0,2}$/.test(path))
      throw new Error('Invalid publication path')
    const [, section, source, slug] = path.split('/')
    if (section === 'ai' && source === 'events' && slug && validEventSlug(slug)) continue
    try {
      if (slug) throw new Error()
      parseArticleFilter(`/${section}`, source ?? null)
    } catch {
      throw new Error('Invalid publication path')
    }
  }
}

function publicationUrls(paths: string[]): string[] {
  const site = new URL(process.env.SITE_URL ?? '')
  if (
    site.protocol !== 'https:' ||
    site.username ||
    site.password ||
    site.search ||
    site.hash ||
    site.pathname !== '/'
  )
    throw new Error('Invalid publication origin')
  return [...new Set(paths)].map((path) => new URL(path, site.origin).href)
}

// Called only after successful Next path/tag invalidation. No database writes.
export async function publishContent(paths: string[], publicationId: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN
  const zone = process.env.CLOUDFLARE_ZONE_ID
  const key = indexNowKey()
  const result: { cloudflare: StepResult; prewarm: StepResult; indexnow: StepResult } = {
    cloudflare: { status: token || zone ? 'failed' : 'disabled' },
    prewarm: { status: 'skipped' },
    indexnow: { status: process.env.INDEXNOW_KEY ? 'failed' : 'disabled' }
  }
  // Validate even disabled calls; a notification cannot introduce an arbitrary URL later.
  validatePaths(paths)
  if (!token && !zone && !process.env.INDEXNOW_KEY) return result
  const urls = publicationUrls(paths)
  const deadline = AbortSignal.timeout(25_000)
  const request = (url: string, init: RequestInit) =>
    fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.any([deadline, AbortSignal.timeout(3000)])
    })
  try {
    if (token && zone && /^[a-f0-9]{32}$/i.test(zone)) {
      for (let offset = 0; offset < urls.length; offset += 30) {
        const response = await request(
          `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: urls.slice(offset, offset + 30) })
          }
        )
        result.cloudflare.httpStatus = response.status
        if (!response.ok || (await response.json()).success !== true)
          throw new Error('Purge failed')
      }
      result.cloudflare.status = 'succeeded'
      result.prewarm.status = 'succeeded'
      for (const url of urls.slice(0, 5)) {
        try {
          const response = await request(url, {
            method: 'GET',
            headers: { Accept: 'text/html, application/xml' }
          })
          // Removed pages are an expected successful publication outcome.
          if (!response.ok && response.status !== 404 && response.status !== 410)
            result.prewarm.status = 'failed'
          await response.body?.cancel()
        } catch {
          result.prewarm.status = 'failed'
        }
      }
    }
  } catch {
    result.cloudflare.status = 'failed'
  }

  const indexable = urls.filter((url) => new URL(url).pathname !== '/sitemap.xml')
  if (result.cloudflare.status === 'failed') {
    result.indexnow.status = 'skipped'
  } else if (key && indexable.length) {
    const origin = new URL(urls[0]).origin
    for (let attempt = 1; attempt <= 3; attempt++) {
      result.indexnow.attempts = attempt
      let retry = false
      try {
        const response = await request('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: new URL(origin).host,
            key,
            keyLocation: `${origin}/indexnow.txt`,
            urlList: indexable
          })
        })
        result.indexnow.httpStatus = response.status
        await response.body?.cancel()
        if (response.status === 200 || response.status === 202) {
          result.indexnow.status = 'succeeded'
          break
        }
        retry = response.status === 429 || response.status >= 500
      } catch {
        retry = true
      }
      if (!retry || attempt === 3 || deadline.aborted) break
      await new Promise((resolve) => setTimeout(resolve, attempt * 250))
    }
  }
  console.info(
    JSON.stringify({
      publicationId,
      urlCount: urls.length,
      at: new Date().toISOString(),
      ...result
    })
  )
  return result
}
