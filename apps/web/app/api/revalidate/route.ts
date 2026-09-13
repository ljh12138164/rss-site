import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { after } from 'next/server'
import { validEventSlug } from '../../../lib/ai-events'
import { publishContent } from '../../../lib/content-publication'
import { parseArticleFilter } from '../../../lib/home-articles'
import { isSkillSourceId } from '../../../lib/technology-sources'

export const runtime = 'nodejs'
export const maxDuration = 60

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
  let publicationId = randomUUID()
  try {
    const input = await request.json()
    if (
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      Object.keys(input).some((key) => !['section', 'source', 'events', 'batchId'].includes(key))
    )
      throw new Error('Invalid scope')
    if (input.batchId !== undefined) {
      if (
        typeof input.batchId !== 'string' ||
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.batchId)
      )
        throw new Error('Invalid batch')
      publicationId = input.batchId
    }
    if (input.events !== undefined) {
      if (
        !Array.isArray(input.events) ||
        input.events.length > 100 ||
        !input.events.every((slug: unknown) => typeof slug === 'string' && validEventSlug(slug))
      )
        throw new Error('Invalid events')
      eventSlugs = [...new Set<string>(input.events)]
    }
    if (input.section !== undefined || input.source !== undefined) {
      if (!input || typeof input.section !== 'string' || typeof input.source !== 'string')
        throw new Error('Invalid scope')
      if (input.section === 'skills' && isSkillSourceId(input.source)) {
        section = '/skills'
        source = input.source
      } else {
        const filter = parseArticleFilter(`/${input.section}`, input.source)
        if (!filter.section || !filter.source) throw new Error('Invalid scope')
        section = filter.section
        source = filter.source
      }
    } else if (!eventSlugs.length) throw new Error('Invalid scope')
  } catch {
    return Response.json({ error: 'Invalid section or source' }, { status: 400 })
  }

  try {
    if (section === '/ai' || eventSlugs.length) revalidateTag('event-status', { expire: 0 })
    if (section) revalidateTag(`news-status:${source}`, { expire: 0 })
    const paths = [
      '/',
      '/sitemap.xml',
      ...(source === 'github'
        ? ['/github']
        : section === '/skills'
          ? ['/skills']
          : section
            ? [section, `${section}/${source}`]
            : []),
      ...eventSlugs.map((slug) => `/ai/events/${slug}`)
    ]
    if (section === '/ai' || eventSlugs.length) paths.push('/ai/events')
    for (const path of paths) revalidatePath(path)
    if (section === '/ai' || eventSlugs.length) revalidatePath('/ai/events/[slug]', 'page')
    if (section && source !== 'github' && section !== '/skills')
      revalidatePath(`${section}/${source}/[slug]`, 'page')
    after(async () => {
      try {
        await publishContent(paths, publicationId)
      } catch {
        console.info(
          JSON.stringify({ publicationId, publication: 'failed', at: new Date().toISOString() })
        )
      }
    })
    return Response.json(
      { revalidated: true, paths, publicationId },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return Response.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
