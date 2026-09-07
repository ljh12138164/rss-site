import { createHash, timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { validEventSlug } from '../../../lib/ai-events'
import { parseArticleFilter } from '../../../lib/home-articles'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return Response.json({ error: 'Revalidation is not configured' }, { status: 503 })
  const authorization = request.headers.get('authorization')
  if (
    !authorization?.startsWith('Bearer ') ||
    !timingSafeEqual(
      createHash('sha256').update(authorization.slice(7)).digest(),
      createHash('sha256').update(secret).digest()
    )
  )
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let section: string | undefined
  let source: string | undefined
  let eventSlugs: string[] = []
  try {
    const input = await request.json()
    if (input && Array.isArray(input.events) && Object.keys(input).length === 1) {
      if (
        !input.events.length ||
        input.events.length > 100 ||
        !input.events.every((slug: unknown) => typeof slug === 'string' && validEventSlug(slug))
      )
        throw new Error('Invalid events')
      eventSlugs = [...new Set<string>(input.events)]
    } else {
      if (
        !input ||
        typeof input.section !== 'string' ||
        typeof input.source !== 'string' ||
        Object.keys(input).some((key) => key !== 'section' && key !== 'source')
      )
        throw new Error('Invalid scope')
      const filter = parseArticleFilter(`/${input.section}`, input.source)
      if (!filter.section || !filter.source) throw new Error('Invalid scope')
      section = filter.section
      source = filter.source
    }
  } catch {
    return Response.json({ error: 'Invalid section or source' }, { status: 400 })
  }

  try {
    if (section === '/ai' || eventSlugs.length) revalidateTag('event-status', { expire: 0 })
    if (section) revalidateTag(`news-status:${source}`, { expire: 0 })
    const paths = [
      '/',
      '/sitemap.xml',
      ...(section ? [section, `${section}/${source}`] : []),
      ...eventSlugs.map((slug) => `/ai/events/${slug}`)
    ]
    if (section === '/ai' || eventSlugs.length) paths.push('/ai/events')
    for (const path of paths) revalidatePath(path)
    if (section === '/ai' || eventSlugs.length) revalidatePath('/ai/events/[slug]', 'page')
    if (section) revalidatePath(`${section}/${source}/[slug]`, 'page')
    return Response.json({ revalidated: true, paths }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
