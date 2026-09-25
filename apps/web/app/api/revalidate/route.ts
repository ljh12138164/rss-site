import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { getSignalSource, isSignalSourceId } from '@rss-site/signals'
import { revalidatePath, revalidateTag } from 'next/cache'
import { after } from 'next/server'
import { validEventSlug } from '../../../lib/ai-events'
import { CACHE_HEADERS } from '../../../lib/cache'
import { publishContent } from '../../../lib/content-publication'
import { resolveRevalidation } from '../../../lib/revalidate-paths'

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
      if (!isSignalSourceId(input.source)) throw new Error('Invalid scope')
      const signalSource = getSignalSource(input.source)
      if (signalSource.section !== input.section) throw new Error('Invalid scope')
      section = `/${signalSource.section}`
      source = signalSource.id
    } else if (!eventSlugs.length) throw new Error('Invalid scope')
  } catch {
    return Response.json({ error: 'Invalid section or source' }, { status: 400 })
  }

  try {
    const { paths, dynamicPages, tags } = resolveRevalidation({ section, source, eventSlugs })
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    for (const path of paths) revalidatePath(path)
    for (const dynamicPath of dynamicPages) revalidatePath(dynamicPath, 'page')

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
      { headers: CACHE_HEADERS.NO_STORE }
    )
  } catch {
    return Response.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
