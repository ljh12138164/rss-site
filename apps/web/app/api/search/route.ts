import {
  SEARCH_PAGE_SIZE,
  searchExcerpt,
  searchFilter,
  searchValidation
} from '../../../lib/article-search'
import { getPublicSupabaseClient } from '../../../lib/supabase'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const query = (params.get('q') ?? '').trim()
  const page = Number(params.get('page') ?? '0')
  const validation = searchValidation(query)
  if (validation || !Number.isInteger(page) || page < 0 || page > 49) {
    return Response.json({ error: validation ?? '页码无效' }, { status: 400 })
  }

  try {
    const { data, error } = await getPublicSupabaseClient()
      .from('signal_articles')
      .select('id,title,summary,source,section,url,published_at')
      .or(searchFilter(query))
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('id')
      .range(page * SEARCH_PAGE_SIZE, (page + 1) * SEARCH_PAGE_SIZE)
      .abortSignal(AbortSignal.any([request.signal, AbortSignal.timeout(5000)]))
    if (error) throw error
    return Response.json(
      {
        items: (data ?? []).slice(0, SEARCH_PAGE_SIZE).map((item) => ({
          ...item,
          summary: item.summary ? searchExcerpt(item.summary, query) : null
        })),
        hasMore: (data?.length ?? 0) > SEARCH_PAGE_SIZE && page < 49
      },
      { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } }
    )
  } catch {
    return Response.json({ error: '暂时无法搜索，请稍后重试' }, { status: 503 })
  }
}
