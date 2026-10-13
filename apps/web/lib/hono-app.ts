import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { getSignalSource, isSignalSourceId, listSignalSources } from '@rss-site/signals'
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { getAdminDataClient } from './admin-supabase'
import { getEvent, getEventPage, parseEventCursor, validEventSlug } from './ai-events'
import { articleSource } from './article-route'
import {
  parseSearchScope,
  SEARCH_PAGE_SIZE,
  searchExcerpt,
  searchFilter,
  searchValidation
} from './article-search'
import { SummaryBusyError, summarizeArticleOnce } from './article-summary'
import {
  TranslationBusyError,
  translateArticleOnce,
  translateEventOnce
} from './article-translation'
import { CACHE_HEADERS } from './cache'
import { updateContent } from './content-update'
import {
  type ArticleFilter,
  getHomeArticles,
  parseArticleFilter,
  parseHomeCursor
} from './home-articles'
import type { IngestionHealth } from './ingestion-health'
import { getNewsArticle } from './signal-article'
import { getPublicSupabaseClient } from './supabase'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const editInput = validator('json', (value, c) => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return c.json({ error: '编辑内容无效' }, 400)
  const input = value as Record<string, unknown>
  if (
    Object.keys(input).some(
      (key) =>
        ![
          'title',
          'summary',
          'contentHtml',
          'imageUrl',
          'author',
          'publishedAt',
          'isPinned'
        ].includes(key)
    ) ||
    typeof input.title !== 'string' ||
    !input.title.trim() ||
    input.title.length > 500 ||
    (input.summary !== null && typeof input.summary !== 'string') ||
    (input.contentHtml !== null && typeof input.contentHtml !== 'string') ||
    (typeof input.contentHtml === 'string' &&
      new TextEncoder().encode(input.contentHtml).length > 524288) ||
    (input.imageUrl !== null &&
      (typeof input.imageUrl !== 'string' || !/^https?:\/\//.test(input.imageUrl))) ||
    (input.author !== null && typeof input.author !== 'string') ||
    (input.publishedAt !== null &&
      (typeof input.publishedAt !== 'string' || !Number.isFinite(Date.parse(input.publishedAt)))) ||
    typeof input.isPinned !== 'boolean'
  )
    return c.json({ error: '编辑内容无效' }, 400)
  return {
    title: input.title.trim(),
    summary: input.summary as string | null,
    contentHtml: input.contentHtml as string | null,
    imageUrl: input.imageUrl as string | null,
    author: input.author as string | null,
    publishedAt: input.publishedAt as string | null,
    isPinned: input.isPinned
  }
})

const translationInput = validator('json', (value, c) => {
  if (!value || typeof value !== 'object') return c.json({ error: '请求格式无效' }, 400)
  const { id, source } = value as Record<string, unknown>
  if (typeof id !== 'string' || !uuidPattern.test(id) || typeof source !== 'string') {
    return c.json({ error: '文章参数无效' }, 400)
  }
  return { id: id.toLowerCase(), source }
})

const eventTranslationInput = validator('json', (value, c) => {
  if (!value || typeof value !== 'object') return c.json({ error: '请求格式无效' }, 400)
  const { slug } = value as Record<string, unknown>
  if (typeof slug !== 'string' || !validEventSlug(slug)) {
    return c.json({ error: '事件参数无效' }, 400)
  }
  return { slug }
})

export const app = new Hono()
  .basePath('/api')
  .post('/articles/summarize', translationInput, async (c) => {
    c.header('Cache-Control', 'no-store')
    const { id, source } = c.req.valid('json')
    const entry = articleSource(source)
    if (!entry) return c.json({ error: '文章来源无效' }, 400)
    try {
      const article = await getNewsArticle(id, entry.source.id)
      if (!article) return c.json({ error: '文章不存在' }, 404)
      const summary = await summarizeArticleOnce(article, entry.section.id)
      return c.json({ summary }, 200)
    } catch (error) {
      if (error instanceof SummaryBusyError)
        return c.json({ error: '总结任务较多，请稍后重试' }, 429)
      if (error instanceof Error && error.message === 'SUMMARY_EMPTY')
        return c.json({ error: '来源未提供可总结的正文或摘要，请查看原文' }, 422)
      if (error instanceof Error && error.message === 'SUMMARY_TOO_LONG')
        return c.json({ error: '文章内容超过总结长度限制，请查看原文' }, 413)
      return c.json({ error: '暂时无法生成总结，请稍后重试' }, 503)
    }
  })
  .post('/articles/translate', translationInput, async (c) => {
    const { id, source } = c.req.valid('json')
    const entry = articleSource(source)
    if (!entry) return c.json({ error: '文章来源无效' }, 400)

    try {
      const article = await getNewsArticle(id, entry.source.id)
      if (!article) return c.json({ error: '文章不存在' }, 404)
      const translation = await translateArticleOnce(article, entry.section.id)
      return c.json({ translation }, 200)
    } catch (error) {
      if (error instanceof TranslationBusyError) {
        return c.json({ error: '翻译任务较多，请稍后重试' }, 429)
      }
      if (error instanceof Error && error.message === 'ARTICLE_NOT_ENGLISH') {
        return c.json({ error: '当前文章不是英文内容' }, 422)
      }
      return c.json({ error: '暂时无法翻译，请稍后重试' }, 503)
    }
  })
  .post('/events/translate', eventTranslationInput, async (c) => {
    const { slug } = c.req.valid('json')

    try {
      const event = await getEvent(slug)
      if (!event) return c.json({ error: '事件不存在' }, 404)
      const translation = await translateEventOnce(event)
      return c.json({ translation }, 200)
    } catch (error) {
      if (error instanceof TranslationBusyError) {
        return c.json({ error: '翻译任务较多，请稍后重试' }, 429)
      }
      if (error instanceof Error && error.message === 'EVENT_NOT_ENGLISH') {
        return c.json({ error: '当前事件不是英文内容' }, 422)
      }
      return c.json({ error: '暂时无法翻译，请稍后重试' }, 503)
    }
  })
  .get('/articles', async (c) => {
    let filter: ArticleFilter
    let cursor: ReturnType<typeof parseHomeCursor> | null
    try {
      const value = c.req.query('cursor')
      cursor = value === undefined ? null : parseHomeCursor(value)
      filter = parseArticleFilter(
        c.req.query('section') ?? null,
        c.req.query('source') ?? null,
        c.req.query('sources') ?? null
      )
    } catch {
      return c.json({ error: '分页位置无效，请刷新页面。' }, 400)
    }
    try {
      c.header('Cache-Control', 'no-store')
      return c.json(await getHomeArticles(cursor, c.req.raw.signal, filter))
    } catch {
      return c.json({ error: '暂时无法加载，请稍后重试。' }, 503)
    }
  })
  .get('/events', async (c) => {
    const cursor = c.req.query('cursor') ?? null
    try {
      parseEventCursor(cursor)
    } catch {
      return c.json({ error: 'Invalid cursor' }, 400)
    }
    try {
      c.header('Cache-Control', 'no-store')
      return c.json(await getEventPage(cursor))
    } catch {
      return c.json({ error: 'Events unavailable' }, 503)
    }
  })
  .get('/search', async (c) => {
    const query = (c.req.query('q') ?? '').trim()
    const page = Number(c.req.query('page') ?? '0')
    const validation = searchValidation(query)
    if (validation || !Number.isInteger(page) || page < 0 || page > 49)
      return c.json({ error: validation ?? '页码无效' }, 400)
    let scope: ReturnType<typeof parseSearchScope>
    try {
      scope = parseSearchScope(
        c.req.query('section') ?? null,
        c.req.query('source') ?? null,
        c.req.query('range'),
        c.req.query('at')
      )
    } catch {
      return c.json({ error: '搜索筛选条件无效' }, 400)
    }
    try {
      let request = getPublicSupabaseClient()
        .from('signal_articles')
        .select('id,title,summary,source,section,url,published_at')
        .in(
          'source',
          listSignalSources({ isArticle: true }).map((source) => source.id)
        )
        .or(searchFilter(query))
      if (scope.section) request = request.eq('section', scope.section.slice(1))
      if (scope.source) request = request.eq('source', scope.source)
      if (c.req.query('at')) request = request.lte('first_seen_at', scope.at)
      if (scope.since)
        request = request.gte('published_at', scope.since).lte('published_at', scope.at)
      const { data, error } = await request
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('id')
        .range(page * SEARCH_PAGE_SIZE, (page + 1) * SEARCH_PAGE_SIZE)
        .abortSignal(AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(5000)]))
      if (error) throw error
      c.header('Cache-Control', 'public, max-age=30, s-maxage=30')
      return c.json({
        items: (data ?? []).slice(0, SEARCH_PAGE_SIZE).map((item) => ({
          ...item,
          summary: item.summary ? searchExcerpt(item.summary, query) : null
        })),
        hasMore: (data?.length ?? 0) > SEARCH_PAGE_SIZE && page < 49
      })
    } catch {
      return c.json({ error: '暂时无法搜索，请稍后重试' }, 503)
    }
  })
  .post('/revalidate', async (c) => {
    const secret = process.env.REVALIDATE_SECRET
    if (!secret) return c.json({ error: 'Revalidation is not configured' }, 503)
    const authorization = c.req.header('authorization')
    if (
      !authorization?.startsWith('Bearer ') ||
      !timingSafeEqual(
        createHash('sha256').update(authorization.slice(7)).digest(),
        createHash('sha256').update(secret).digest()
      )
    )
      return c.json({ error: 'Unauthorized' }, 401)

    let section: string | undefined
    let source: string | undefined
    let eventSlugs: string[] = []
    let publicationId = randomUUID()
    try {
      const input = await c.req.json()
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
        if (typeof input.section !== 'string' || typeof input.source !== 'string')
          throw new Error('Invalid scope')
        if (!isSignalSourceId(input.source)) throw new Error('Invalid scope')
        const signalSource = getSignalSource(input.source)
        if (signalSource.section !== input.section) throw new Error('Invalid scope')
        section = `/${signalSource.section}`
        source = signalSource.id
      } else if (!eventSlugs.length) throw new Error('Invalid scope')
    } catch {
      return c.json({ error: 'Invalid section or source' }, 400)
    }

    try {
      const { paths } = updateContent({ section, source, eventSlugs, publicationId })
      c.header('Cache-Control', CACHE_HEADERS.NO_STORE['Cache-Control'])
      return c.json({ revalidated: true, paths, publicationId })
    } catch {
      return c.json({ error: 'Failed to revalidate' }, 500)
    }
  })
  .get('/admin/ingestion', async (c) => {
    c.header('Cache-Control', 'no-store')
    try {
      const client = await getAdminDataClient(c.req.header('authorization'))
      if (!client) return c.json({ error: 'Unauthorized' }, 401)
      const { data, error } = await client
        .rpc('get_ingestion_health')
        .abortSignal(AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(10000)]))
      if (error) return c.json({ error: '采集统计读取失败，请重试' }, 503)
      return c.json({ items: (data ?? []) as IngestionHealth[] })
    } catch {
      return c.json({ error: '采集统计读取失败，请重试' }, 503)
    }
  })
  .get('/admin/articles', async (c) => {
    const client = await getAdminDataClient(c.req.header('authorization'))
    if (!client) return c.json({ error: 'Unauthorized' }, 401)
    const page = Number(c.req.query('page') ?? '0')
    const search = (c.req.query('q') ?? '').trim()
    if (!Number.isInteger(page) || page < 0 || page > 999) return c.json({ error: '页码无效' }, 400)
    if (search.length > 80) return c.json({ error: '搜索词过长' }, 400)
    let query = client
      .from('signal_articles')
      .select(
        'id,section,source,title,url,image_url,summary,content_html,author,published_at,is_pinned,editorial_locked,first_seen_at'
      )
    if (search) query = query.ilike('title', `%${search}%`)
    const { data, error } = await query
      .order('first_seen_at', { ascending: false })
      .order('id', { ascending: false })
      .range(page * 30, page * 30 + 30)
    if (error) return c.json({ error: '文章加载失败' }, 503)
    c.header('Cache-Control', 'no-store')
    return c.json({ items: (data ?? []).slice(0, 30), hasMore: (data?.length ?? 0) > 30 })
  })
  .patch('/admin/articles/:id', editInput, async (c) => {
    const client = await getAdminDataClient(c.req.header('authorization'))
    if (!client) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    if (!uuidPattern.test(id)) return c.json({ error: '文章 ID 无效' }, 400)
    const input = c.req.valid('json')
    const { data: previous, error: previousError } = await client
      .from('signal_articles')
      .select('title')
      .eq('id', id)
      .single()
    if (previousError) return c.json({ error: '文章不存在或无法读取' }, 404)
    const { data, error } = await client
      .from('signal_articles')
      .update({
        title: input.title,
        summary: input.summary,
        content_html: input.contentHtml,
        image_url: input.imageUrl,
        author: input.author,
        published_at: input.publishedAt,
        is_pinned: input.isPinned,
        editorial_locked: true
      })
      .eq('id', id)
      .select(
        'id,section,source,title,url,image_url,summary,content_html,author,published_at,is_pinned,editorial_locked,first_seen_at'
      )
      .single()
    if (error) return c.json({ error: '保存失败，请检查字段和管理员权限' }, 503)
    try {
      updateContent({
        section: `/${data.section}`,
        source: data.source,
        article: { id, previousTitle: previous.title, title: data.title }
      })
    } catch {
      // The edit is already saved; invalidation failure must not invite a duplicate save.
    }
    c.header('Cache-Control', 'no-store')
    return c.json({ article: data })
  })

export type AppType = typeof app
