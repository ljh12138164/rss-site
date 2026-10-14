import { readSkillsPreview } from './skill-detail'
import { getPublicSupabaseClient } from './supabase'
import {
  type AiSourceId,
  type FinanceSourceId,
  type GameSourceId,
  getSignalSource,
  listSignalSources,
  type NewsSourceId,
  type SignalSectionId,
  type SignalSourceId,
  type SkillSourceId,
  type SocialSourceId,
  type TechnologySourceId
} from './technology-sources'

export interface HotItemRow {
  article_id?: string | null
  source: string
  source_key: string
  title: string
  url: string
  image_url?: string | null
  summary: string | null
  author: string | null
  published_at: string | null
  position: number
}

export interface SourceStatusRow {
  source: string
  item_count: number
  last_success_at: string
}

export interface FeedCollectionQueryResult {
  items: HotItemRow[] | null
  statuses: SourceStatusRow[] | null
  error: string | null
}

export type FeedCollectionQuery = () => Promise<FeedCollectionQueryResult>

export interface HotItem {
  articleId?: string | null
  sourceKey: string
  title: string
  url: string
  imageUrl?: string | null
  summary: string | null
  author: string | null
  publishedAt: Date | null
  position: number
}

export function compareHotItemsByPublishedAt(
  left: Pick<HotItem, 'publishedAt'>,
  right: Pick<HotItem, 'publishedAt'>
): number {
  const leftTime = left.publishedAt?.getTime()
  const rightTime = right.publishedAt?.getTime()
  const hasLeftTime = leftTime !== undefined && Number.isFinite(leftTime)
  const hasRightTime = rightTime !== undefined && Number.isFinite(rightTime)

  if (hasLeftTime && hasRightTime) return rightTime - leftTime
  if (hasLeftTime) return -1
  if (hasRightTime) return 1
  return 0
}

export type FeedResult =
  | {
      state: 'ready'
      items: HotItem[]
      status: {
        itemCount: number
        lastSuccessAt: Date
      }
    }
  | { state: 'empty' }
  | { state: 'error' }

export type TechnologyFeeds = Record<TechnologySourceId, FeedResult>
export type SkillFeeds = Record<SkillSourceId, FeedResult>
export type NewsFeeds = Record<NewsSourceId, FeedResult>
export type AiFeeds = Record<AiSourceId, FeedResult>
export type SocialFeeds = Record<SocialSourceId, FeedResult>
export type FinanceFeeds = Record<FinanceSourceId, FeedResult>
export type GameFeeds = Record<GameSourceId, FeedResult>

async function querySectionFeeds(
  section: SignalSectionId,
  sourceIds: SignalSourceId[]
): Promise<FeedCollectionQueryResult> {
  if (section === 'skills') {
    const preview = await readSkillsPreview()
    if (preview) return { items: preview.items, statuses: preview.statuses, error: null }
  }
  try {
    const supabase = getPublicSupabaseClient()
    const [itemsResult, statusesResult] = await Promise.all([
      supabase
        .from('hot_items')
        .select(
          'article_id,source,source_key,title,url,image_url,summary,author,published_at,position'
        )
        .eq('section', section)
        .in('source', sourceIds)
        .order('position', { ascending: true }),
      supabase
        .from('source_status')
        .select('source,item_count,last_success_at')
        .in('source', sourceIds)
    ])

    return {
      items: itemsResult.data as HotItemRow[] | null,
      statuses: statusesResult.data as SourceStatusRow[] | null,
      error: itemsResult.error?.message ?? statusesResult.error?.message ?? null
    }
  } catch {
    return { items: null, statuses: null, error: 'Supabase is unavailable' }
  }
}

function buildFeed(
  source: SignalSourceId,
  result: FeedCollectionQueryResult,
  limit?: number
): FeedResult {
  if (result.error) return { state: 'error' }

  const items = (result.items ?? [])
    .filter((row) => row.source === source)
    .map((row) => ({
      articleId: row.article_id ?? null,
      sourceKey: row.source_key,
      title: row.title,
      url: row.url,
      imageUrl: row.image_url ?? null,
      summary: row.summary,
      author: row.author,
      publishedAt: row.published_at ? new Date(row.published_at) : null,
      position: row.position
    }))
    .sort((left, right) =>
      source === 'github' || source === 'skills-all-time' || source === 'skills-trending'
        ? left.position - right.position
        : compareHotItemsByPublishedAt(left, right) || left.position - right.position
    )
    .slice(0, limit)

  if (items.length === 0) return { state: 'empty' }

  const status = (result.statuses ?? []).find((candidate) => candidate.source === source)
  if (!status) return { state: 'error' }

  return {
    state: 'ready',
    items,
    status: {
      itemCount: status.item_count,
      lastSuccessAt: new Date(status.last_success_at)
    }
  }
}

/**
 * Generic reader to query all signal feeds for any section.
 */
export async function getSectionFeeds<T extends SignalSourceId = SignalSourceId>(
  section: SignalSectionId,
  limitPerSource?: number,
  query?: FeedCollectionQuery
): Promise<Record<T, FeedResult>> {
  const sources = listSignalSources({ section })
  const defaultQuery = () =>
    querySectionFeeds(
      section,
      sources.map((s) => s.id)
    )
  const result = await (query ?? defaultQuery)()

  return Object.fromEntries(
    sources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as Record<T, FeedResult>
}

/**
 * Generic reader to query a single signal feed by source ID.
 */
export async function getSourceFeed(
  sourceId: SignalSourceId,
  limit?: number,
  query?: FeedCollectionQuery
): Promise<FeedResult> {
  const source = getSignalSource(sourceId)
  const defaultQuery = () => querySectionFeeds(source.section, [source.id])
  const result = await (query ?? defaultQuery)()
  return buildFeed(source.id, result, limit)
}

// Section-specific typed specializations (100% backward compatible)
export const getTechnologyFeeds = (limitPerSource?: number, query?: FeedCollectionQuery) =>
  getSectionFeeds<TechnologySourceId>('technology', limitPerSource, query)

export const getTechnologyFeed = (
  source: TechnologySourceId,
  limit?: number,
  query?: FeedCollectionQuery
) => getSourceFeed(source, limit, query)

export const getSkillFeeds = (query?: FeedCollectionQuery) =>
  getSectionFeeds<SkillSourceId>('skills', undefined, query)

export const getNewsFeeds = (limitPerSource?: number, query?: FeedCollectionQuery) =>
  getSectionFeeds<NewsSourceId>('news', limitPerSource, query)

export const getNewsFeed = (source: NewsSourceId, limit?: number, query?: FeedCollectionQuery) =>
  getSourceFeed(source, limit, query)

export const getAiFeeds = (limitPerSource?: number, query?: FeedCollectionQuery) =>
  getSectionFeeds<AiSourceId>('ai', limitPerSource, query)

export const getAiFeed = (source: AiSourceId, limit?: number, query?: FeedCollectionQuery) =>
  getSourceFeed(source, limit, query)

export const getSocialFeeds = (limitPerSource?: number, query?: FeedCollectionQuery) =>
  getSectionFeeds<SocialSourceId>('social', limitPerSource, query)

export const getSocialFeed = (
  source: SocialSourceId,
  limit?: number,
  query?: FeedCollectionQuery
) => getSourceFeed(source, limit, query)

export const getFinanceFeeds = (limitPerSource?: number, query?: FeedCollectionQuery) =>
  getSectionFeeds<FinanceSourceId>('finance', limitPerSource, query)

export const getFinanceFeed = (
  source: FinanceSourceId,
  limit?: number,
  query?: FeedCollectionQuery
) => getSourceFeed(source, limit, query)

export const getGameFeeds = (limitPerSource?: number, query?: FeedCollectionQuery) =>
  getSectionFeeds<GameSourceId>('games', limitPerSource, query)

export const getGameFeed = (source: GameSourceId, limit?: number, query?: FeedCollectionQuery) =>
  getSourceFeed(source, limit, query)
