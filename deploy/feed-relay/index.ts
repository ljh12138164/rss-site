const feeds = new Map([
  ['/google-ai', 'https://blog.google/innovation-and-ai/technology/ai/rss/'],
  ['/simon-willison', 'https://simonwillison.net/atom/entries/']
])

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 })
    const url = new URL(request.url)
    const target = !url.search && feeds.get(url.pathname)
    if (!target) return new Response('Not found', { status: 404 })

    try {
      const response = await fetch(target, {
        redirect: 'manual',
        signal: AbortSignal.timeout(20_000),
        headers: {
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
          'User-Agent': 'rss-site/1.0 (+https://github.com/ljh12138164/rss-site)'
        }
      })
      if (!response.ok) {
        await response.body?.cancel()
        console.error(JSON.stringify({ source: url.pathname, status: response.status }))
        return new Response('Upstream feed unavailable', { status: 502 })
      }
      return new Response(response.body, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') ?? 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=120'
        }
      })
    } catch (error) {
      console.error(
        JSON.stringify({
          source: url.pathname,
          error: error instanceof Error ? error.message : 'upstream_fetch_failed'
        })
      )
      return new Response('Upstream feed unavailable', { status: 502 })
    }
  }
}
