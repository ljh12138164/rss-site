import { getPublicSupabaseClient } from './supabase'
import {
  type AiSourceId,
  aiSources,
  type FinanceSourceId,
  financeSources,
  type GameSourceId,
  gameSources,
  type NewsSourceId,
  newsSources,
  type SignalSourceId,
  type SocialSourceId,
  socialSources,
  type TechnologySourceId,
  technologySources
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
export type NewsFeeds = Record<NewsSourceId, FeedResult>
export type AiFeeds = Record<AiSourceId, FeedResult>
export type SocialFeeds = Record<SocialSourceId, FeedResult>
export type FinanceFeeds = Record<FinanceSourceId, FeedResult>
export type GameFeeds = Record<GameSourceId, FeedResult>

async function querySectionFeeds(
  section: 'technology' | 'news' | 'ai' | 'social' | 'finance' | 'games',
  sourceIds: SignalSourceId[]
): Promise<FeedCollectionQueryResult> {
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

const queryTechnologyFeeds = () =>
  querySectionFeeds(
    'technology',
    technologySources.map((source) => source.id)
  )

const queryNewsFeeds = () =>
  querySectionFeeds(
    'news',
    newsSources.map((source) => source.id)
  )

const queryAiFeeds = () =>
  querySectionFeeds(
    'ai',
    aiSources.map((source) => source.id)
  )

const querySocialFeeds = () =>
  querySectionFeeds(
    'social',
    socialSources.map((source) => source.id)
  )

const queryFinanceFeeds = () =>
  querySectionFeeds(
    'finance',
    financeSources.map((source) => source.id)
  )

const queryGameFeeds = () =>
  querySectionFeeds(
    'games',
    gameSources.map((source) => source.id)
  )

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
      source === 'github'
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

export async function getTechnologyFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryTechnologyFeeds
): Promise<TechnologyFeeds> {
  const result = await query()

  return Object.fromEntries(
    technologySources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as TechnologyFeeds
}

export async function getTechnologyFeed(
  source: TechnologySourceId,
  limit?: number,
  query: FeedCollectionQuery = queryTechnologyFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getNewsFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryNewsFeeds
): Promise<NewsFeeds> {
  const result = await query()

  return Object.fromEntries(
    newsSources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as NewsFeeds
}

export async function getNewsFeed(
  source: NewsSourceId,
  limit?: number,
  query: FeedCollectionQuery = queryNewsFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getAiFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryAiFeeds
): Promise<AiFeeds> {
  const result = await query()

  return Object.fromEntries(
    aiSources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as AiFeeds
}

export async function getAiFeed(
  source: AiSourceId,
  limit?: number,
  query: FeedCollectionQuery = queryAiFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getSocialFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = querySocialFeeds
): Promise<SocialFeeds> {
  const result = await query()

  return Object.fromEntries(
    socialSources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as SocialFeeds
}

export async function getSocialFeed(
  source: SocialSourceId,
  limit?: number,
  query: FeedCollectionQuery = querySocialFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getFinanceFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryFinanceFeeds
): Promise<FinanceFeeds> {
  const result = await query()

  return Object.fromEntries(
    financeSources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as FinanceFeeds
}

export async function getFinanceFeed(
  source: FinanceSourceId,
  limit?: number,
  query: FeedCollectionQuery = queryFinanceFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getGameFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryGameFeeds
): Promise<GameFeeds> {
  const result = await query()

  return Object.fromEntries(
    gameSources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as GameFeeds
}

export async function getGameFeed(
  source: GameSourceId,
  limit?: number,
  query: FeedCollectionQuery = queryGameFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}
