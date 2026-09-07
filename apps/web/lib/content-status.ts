import { unstable_cache } from 'next/cache'
import { articleSource } from './article-route'
import { getPublicSupabaseClient } from './supabase'

export function getContentStatus(kind: 'event' | 'news', id: string, source: string) {
  return unstable_cache(
    async () => {
      const db = getPublicSupabaseClient()
      const removed = await db
        .from('content_tombstones')
        .select('key')
        .eq('kind', kind)
        .eq('key', kind === 'event' ? id : `${source}/${id}`)
        .abortSignal(AbortSignal.timeout(10000))
        .maybeSingle()
      if (removed.error) throw new Error('Content status unavailable')
      if (removed.data) return 410
      const visible =
        kind === 'event'
          ? await db
              .from('ai_events')
              .select('id')
              .eq('slug', id)
              .eq('status', 'published')
              .abortSignal(AbortSignal.timeout(10000))
              .maybeSingle()
          : await db
              .from('signal_articles')
              .select('id')
              .eq('id', id)
              .eq('section', articleSource(source)?.section.id ?? '')
              .eq('source', source)
              .abortSignal(AbortSignal.timeout(10000))
              .maybeSingle()
      if (visible.error) throw new Error('Content status unavailable')
      return visible.data ? 200 : 404
    },
    ['content-status', kind, id, source],
    {
      revalidate: kind === 'event' ? 7200 : 21600,
      tags: [kind === 'event' ? 'event-status' : `news-status:${source}`]
    }
  )()
}
