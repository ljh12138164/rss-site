import { createHash, randomUUID } from 'node:crypto'
import { listSignalSources } from '@rss-site/signals'
import { convert } from 'html-to-text'
import { safeDailyUrl } from '../../../shared/daily-report'
import {
  HOT_RULE_VERSION,
  type HotAnalysis,
  type HotArticle,
  type HotBatch,
  type HotRanking,
  type HotSnapshot,
  makeHotBatch,
  parseHotBatch,
  rankHotEvents
} from '../../../shared/hot-ranking'
import { getBusinessDatabase } from './business-db'

type Cached = HotAnalysis & { hash: string }
type Raw = {
  id: string
  source: string
  section: string
  title: string
  url: string
  image_url: string | null
  body: string
  at: string
  changed: string
}
const sourceIds: string[] = listSignalSources({ isArticle: true })
  .filter((s) => ['ai', 'technology', 'news', 'social', 'finance', 'games'].includes(s.section))
  .map((s) => s.id)

export function prepareHotArticle(row: Raw): HotArticle | null {
  if (!safeDailyUrl(row.url)) return null
  const text = convert(row.body, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' }
    ]
  })
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length < 80 || text === row.title.trim()) return null
  const hash = createHash('sha256')
    .update(
      JSON.stringify([
        HOT_RULE_VERSION,
        row.id,
        row.source,
        row.title,
        row.url,
        row.at,
        row.changed,
        row.body
      ])
    )
    .digest('hex')
  return {
    id: row.id,
    source: row.source,
    section: row.section,
    title: row.title.slice(0, 500),
    url: row.url,
    imageUrl: safeDailyUrl(row.image_url) ? row.image_url : null,
    text: [...text].slice(0, 1800).join(''),
    at: row.at,
    hash
  }
}

export async function requestHotAnalysis(input: HotBatch, signal: AbortSignal) {
  const base = new URL(process.env.AGENT_SERVICE_URL ?? '')
  const token = process.env.AGENT_SERVICE_TOKEN
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    !token
  )
    throw new Error('hot_configuration')
  base.pathname = '/v1/agents/hot-ranking/analyze'
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(base, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.any([signal, AbortSignal.timeout(115000)]),
      redirect: 'error',
      cache: 'no-store'
    })
    if (!response.ok) {
      await response.body?.cancel()
      if (response.status === 503 && attempt === 0) continue
      throw new Error('hot_analysis_failed')
    }
    const body = await response.text()
    if (Buffer.byteLength(body) > 256 * 1024) throw new Error('hot_analysis_budget')
    return parseHotBatch(input, JSON.parse(body))
  }
  throw new Error('hot_analysis_failed')
}

/** One statement harvests a fixed window; model work never holds a DB transaction. */
export async function refreshHotRanking(analyze = requestHotAnalysis) {
  const sql = getBusinessDatabase().client
  const token = randomUUID()
  const [lease] = await sql<
    { cutoff: string }[]
  >`update hot_ranking_state set lease_token=${token},lease_until=now()+interval '5 minutes',attempted_at=now()
    where singleton and (lease_until is null or lease_until<now())
    and (attempted_at is null or attempted_at<now()-interval '15 minutes') returning attempted_at as cutoff`
  if (!lease) return
  const ownership = new AbortController()
  const signal = AbortSignal.any([ownership.signal, AbortSignal.timeout(45 * 60 * 1000)])
  let renewing = false
  const heartbeat = setInterval(() => {
    if (renewing) return
    renewing = true
    void sql`update hot_ranking_state set lease_until=now()+interval '5 minutes' where singleton and lease_token=${token} and lease_until>now() returning singleton`
      .then((rows) => {
        if (!rows.length) ownership.abort()
      })
      .catch(() => ownership.abort())
      .finally(() => {
        renewing = false
      })
  }, 30000)
  heartbeat.unref()
  try {
    const raw = await sql<
      Raw[]
    >`select id,source,section,title,url,image_url,left(coalesce(nullif(content_html,''),summary,''),12000) as body,
      coalesce(published_at,first_seen_at) as at,content_updated_at as changed from signal_articles
      where source=any(${sourceIds}::text[]) and is_indexable=true
      and coalesce(published_at,first_seen_at)>${lease.cutoff}::timestamptz-interval '48 hours'
      and coalesce(published_at,first_seen_at)<=${lease.cutoff}::timestamptz and first_seen_at<=${lease.cutoff}::timestamptz
      and octet_length(coalesce(nullif(content_html,''),summary,''))<=524288 order by coalesce(published_at,first_seen_at),id limit 4001`
    if (raw.length > 4000) throw new Error('hot_coverage_limit')
    const articles = raw.map(prepareHotArticle).filter((a): a is HotArticle => a !== null)
    const ids = articles.map((a) => a.id)
    const saved = ids.length
      ? await sql<
          Cached[]
        >`select article_id as id,input_hash as hash,event_id as "eventId",title,summary from hot_ranking_analysis where article_id=any(${ids}::uuid[])`
      : []
    const hashes = new Map(articles.map((a) => [a.id, a.hash]))
    const cache = new Map(saved.filter((a) => hashes.get(a.id) === a.hash).map((a) => [a.id, a]))
    const pending = articles.filter((a) => !cache.has(a.id))
    for (let offset = 0; offset < pending.length; ) {
      signal.throwIfAborted()
      const input = makeHotBatch(pending.slice(offset), articles, [...cache.values()])
      const result = await analyze(input, signal)
      signal.throwIfAborted()
      await sql.begin(async (tx) => {
        const owned =
          await tx`select singleton from hot_ranking_state where singleton and lease_token=${token} and lease_until>now() for update`
        if (!owned.length) throw new Error('hot_lease_lost')
        for (const row of result) {
          const hash = hashes.get(row.id)
          if (!hash) throw new Error('hot_unknown_article')
          await tx`insert into hot_ranking_analysis(article_id,input_hash,event_id,title,summary)
            values(${row.id},${hash},${row.eventId},${row.title},${row.summary})
            on conflict(article_id) do update set input_hash=excluded.input_hash,event_id=excluded.event_id,title=excluded.title,summary=excluded.summary,updated_at=now()`
        }
      })
      for (const row of result) cache.set(row.id, { ...row, hash: hashes.get(row.id) ?? '' })
      offset += input.articles.length
    }
    signal.throwIfAborted()
    const health = await sql<
      { source: string; last_success_at: string }[]
    >`select source,last_success_at from source_status where source=any(${sourceIds}::text[])`
    if (
      !health.some((s) => Date.parse(s.last_success_at) > Date.parse(lease.cutoff) - 18 * 3600000)
    )
      throw new Error('hot_coverage_unavailable')
    const snapshot = {
      ...rankHotEvents(articles, [...cache.values()], lease.cutoff),
      laggingSources: sourceIds.filter(
        (source) =>
          !health.some(
            (s) =>
              s.source === source &&
              Date.parse(s.last_success_at) >= Date.parse(lease.cutoff) - 18 * 3600000
          )
      ).length
    }
    const published =
      await sql`update hot_ranking_state set computed_at=${lease.cutoff},snapshot=${JSON.stringify(snapshot)}::text::jsonb,last_error=null,lease_token=null,lease_until=null
      where singleton and lease_token=${token} and lease_until>now() returning singleton`
    if (!published.length) throw new Error('hot_lease_lost')
    // Discard only obsolete derived analyses; source articles are never removed here.
    await sql`delete from hot_ranking_analysis where updated_at<now()-interval '7 days'`
    console.info(
      JSON.stringify({
        hotRanking: 'published',
        articles: articles.length,
        analyzed: pending.length,
        events: snapshot.entries.length,
        at: snapshot.computedAt
      })
    )
  } catch (error) {
    const code =
      error instanceof Error && error.message === 'hot_coverage_limit'
        ? 'coverage_limit'
        : 'refresh_failed'
    await sql`update hot_ranking_state set last_error=${code},lease_token=null,lease_until=null where singleton and lease_token=${token}`
    throw new Error(code)
  } finally {
    clearInterval(heartbeat)
  }
}

export async function getHotRanking(): Promise<HotRanking> {
  try {
    const [row] = await getBusinessDatabase().client<
      { snapshot: HotSnapshot | null; last_error: string | null }[]
    >`select snapshot,last_error from hot_ranking_state where singleton`
    const snapshot = row?.snapshot
    if (
      !snapshot ||
      !Number.isFinite(Date.parse(snapshot.computedAt)) ||
      !Array.isArray(snapshot.entries) ||
      snapshot.entries.length > 5
    )
      return { state: 'unavailable' }
    const age = Date.now() - Date.parse(snapshot.computedAt)
    // DB and Web clocks may differ slightly; reject genuinely future snapshots.
    if (age < -60000 || age > 48 * 3600000) return { state: 'unavailable' }
    const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (
      !snapshot.entries.every(
        (e) =>
          uuid.test(e.eventId) &&
          typeof e.title === 'string' &&
          e.title.length > 0 &&
          typeof e.summary === 'string' &&
          e.summary.length > 0 &&
          Number.isFinite(e.heat) &&
          e.heat >= 0 &&
          Number.isInteger(e.participants) &&
          e.participants > 0 &&
          Array.isArray(e.references) &&
          e.references.length > 0 &&
          e.references.length <= 3 &&
          e.references.every(
            (r) =>
              uuid.test(r.id) &&
              sourceIds.includes(r.source) &&
              typeof r.title === 'string' &&
              safeDailyUrl(r.url)
          ) &&
          (e.imageUrl === null || safeDailyUrl(e.imageUrl))
      )
    )
      return { state: 'unavailable' }
    const ids = snapshot.entries.flatMap((e) => e.references.map((r) => r.id))
    const existing = ids.length
      ? await getBusinessDatabase().client<
          { id: string }[]
        >`select id from signal_articles where id=any(${ids}::uuid[])`
      : []
    const available = new Set(existing.map((r) => r.id))
    return {
      ...snapshot,
      entries: snapshot.entries.map((e) => ({
        ...e,
        references: e.references.map((r) => ({ ...r, available: available.has(r.id) }))
      })),
      state: 'ready',
      delayed: !!row?.last_error || age > 30 * 60000
    }
  } catch {
    return { state: 'unavailable' }
  }
}

let timer: ReturnType<typeof setInterval> | undefined
export function startHotRankingMaintenance() {
  if (timer) return
  let running = false
  const refresh = async () => {
    if (running) return
    running = true
    try {
      await refreshHotRanking()
    } catch {
      console.warn(JSON.stringify({ hotRanking: 'refresh_failed', at: new Date().toISOString() }))
    } finally {
      running = false
    }
  }
  timer = setInterval(() => void refresh(), 60000)
  timer.unref()
  void refresh()
}
