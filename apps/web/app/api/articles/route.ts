import {
  type ArticleFilter,
  getHomeArticles,
  parseArticleFilter,
  parseHomeCursor
} from '../../../lib/home-articles'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const value = params.get('cursor')
  let filter: ArticleFilter
  let cursor: ReturnType<typeof parseHomeCursor> | null = null
  try {
    cursor = value === null ? null : parseHomeCursor(value)
    filter = parseArticleFilter(params.get('section'), params.get('source'))
  } catch {
    return Response.json({ error: '分页位置无效，请刷新页面。' }, { status: 400 })
  }
  try {
    return Response.json(await getHomeArticles(cursor, request.signal, filter), {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return Response.json({ error: '暂时无法加载，请稍后重试。' }, { status: 503 })
  }
}
