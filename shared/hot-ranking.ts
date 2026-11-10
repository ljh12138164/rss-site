// Keep synchronized with ai-base/src/hot-ranking/contract.ts.
import { createHash } from 'node:crypto'
export const HOT_RULE_VERSION = 'sources-48h-v1'
export const HOT_BATCH_SIZE = 6
export type HotArticle = {
  id: string
  source: string
  section: string
  title: string
  url: string
  imageUrl: string | null
  text: string
  at: string
  hash: string
}
export type HotAnalysis = { id: string; eventId: string | null; title: string; summary: string }
export type HotEventCandidate = { id: string; titles: string[] }
export type HotBatch = { articles: HotArticle[]; events: HotEventCandidate[] }
export type HotReference = Pick<HotArticle, 'id' | 'source' | 'section' | 'title' | 'url'> & {
  available?: boolean
}
export type HotEntry = {
  eventId: string
  title: string
  summary: string
  heat: number
  participants: number
  imageUrl: string | null
  references: HotReference[]
}
export type HotSnapshot = {
  computedAt: string
  entries: HotEntry[]
  articleCount: number
  laggingSources?: number
}
export type HotRanking =
  | { state: 'unavailable' }
  | ({ state: 'ready'; delayed: boolean } & HotSnapshot)

export function hotParticipant(source: string) {
  // These are channels of the same organization, not independent participants.
  if (source === 'chatgpt' || source === 'openai') return 'openai'
  if (source === 'google-ai' || source === 'antigravity') return 'google'
  return source
}

export function hotEventId(article: Pick<HotArticle, 'id' | 'hash'>) {
  const h = createHash('sha256').update(`${article.id}:${article.hash}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export function parseHotBatch(input: HotBatch, value: unknown): HotAnalysis[] {
  const fail = (reason = 'shape') => {
    throw new Error(`Invalid hot analysis:${reason}`)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail()
  const result = value as { items?: unknown }
  if (
    Object.keys(result).join() !== 'items' ||
    !Array.isArray(result.items) ||
    result.items.length !== input.articles.length
  )
    return fail('count')
  const ids = new Set(input.articles.map((a) => a.id))
  const known = new Set(input.events.map((e) => e.id))
  const seen = new Set<string>()
  const newGroups = new Map<string, string[]>()
  const rows = result.items.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return fail()
    const row = item as Record<string, unknown>
    if (
      Object.keys(row).sort().join() !== 'eligible,eventId,groupKey,id,summary,title' ||
      typeof row.id !== 'string' ||
      !ids.has(row.id) ||
      seen.has(row.id) ||
      typeof row.eligible !== 'boolean'
    )
      return fail('membership')
    seen.add(row.id)
    if (
      typeof row.title !== 'string' ||
      typeof row.summary !== 'string' ||
      row.title.trim() !== row.title ||
      row.summary.trim() !== row.summary ||
      Array.from(row.title).length > 100 ||
      Array.from(row.summary).length > 180
    )
      return fail('text')
    if (!row.eligible) {
      if (row.eventId !== null || row.groupKey !== null || row.title !== '' || row.summary !== '')
        return fail('rejected_item')
    } else {
      if (
        !row.title ||
        !row.summary ||
        !/\p{Script=Han}/u.test(row.title) ||
        !/\p{Script=Han}/u.test(row.summary)
      )
        return fail('language')
      if (row.eventId !== null) {
        if (typeof row.eventId !== 'string' || !known.has(row.eventId) || row.groupKey !== null)
          return fail('event_reference')
      } else {
        if (typeof row.groupKey !== 'string' || !/^n(?:[1-9]|1\d|2[0-4])$/.test(row.groupKey))
          return fail('new_group')
        newGroups.set(row.groupKey, [...(newGroups.get(row.groupKey) ?? []), row.id])
      }
    }
    return row
  })
  const articleById = new Map(input.articles.map((a) => [a.id, a]))
  return rows.map((row) => ({
    id: row.id as string,
    eventId: !row.eligible
      ? null
      : ((row.eventId as string | null) ??
        hotEventId(
          articleById.get(
            [...(newGroups.get(row.groupKey as string) ?? [])].sort()[0] as string
          ) as HotArticle
        )),
    title: row.title as string,
    summary: row.summary as string
  }))
}

/** A reviewer may only split a proposed group, never add new memberships. */
export function splitHotGroups(input: HotBatch, value: unknown, splitIds: unknown) {
  const rows = parseHotBatch(input, value)
  const byId = new Map(input.articles.map((a) => [a.id, a]))
  if (
    !Array.isArray(splitIds) ||
    new Set(splitIds).size !== splitIds.length ||
    splitIds.some((id) => typeof id !== 'string' || !byId.has(id))
  )
    throw new Error('Invalid hot review')
  const split = new Set<string>(splitIds)
  const known = new Set(input.events.map((e) => e.id))
  const oldToNew = new Map<string, string>()
  for (const row of rows
    .filter((r) => r.eventId && !split.has(r.id))
    .sort((a, b) => a.id.localeCompare(b.id))) {
    if (row.eventId && !known.has(row.eventId) && !oldToNew.has(row.eventId))
      oldToNew.set(row.eventId, hotEventId(byId.get(row.id) as HotArticle))
  }
  const groups = new Map<string, string>()
  return {
    items: rows.map((row) => {
      const eventId = !row.eventId
        ? null
        : split.has(row.id)
          ? hotEventId(byId.get(row.id) as HotArticle)
          : (oldToNew.get(row.eventId) ?? row.eventId)
      if (eventId && !known.has(eventId) && !groups.has(eventId))
        groups.set(eventId, `n${groups.size + 1}`)
      return {
        id: row.id,
        eligible: eventId !== null,
        eventId: eventId && known.has(eventId) ? eventId : null,
        groupKey: eventId && !known.has(eventId) ? groups.get(eventId) : null,
        title: row.title,
        summary: row.summary
      }
    })
  }
}

export function rankHotEvents(
  articles: HotArticle[],
  analyses: HotAnalysis[],
  cutoff: string
): HotSnapshot {
  const at = Date.parse(cutoff)
  if (!Number.isFinite(at)) throw new Error('Invalid heat cutoff')
  const byId = new Map(articles.map((a) => [a.id, a]))
  const groups = new Map<string, { article: HotArticle; analysis: HotAnalysis }[]>()
  for (const analysis of analyses) {
    const article = byId.get(analysis.id)
    if (!article || !analysis.eventId) continue
    const age = at - Date.parse(article.at)
    if (!Number.isFinite(age) || age < 0 || age >= 48 * 3600000) continue
    groups.set(analysis.eventId, [...(groups.get(analysis.eventId) ?? []), { article, analysis }])
  }
  const ranked = [...groups]
    .map(([eventId, members]) => {
      const participants = new Map<string, number>()
      for (const { article } of members)
        participants.set(
          hotParticipant(article.source),
          Math.max(
            participants.get(hotParticipant(article.source)) ?? -Infinity,
            Date.parse(article.at)
          )
        )
      const rawHeat = [...participants.values()].reduce(
        (sum, t) => sum + 2 ** (-(at - t) / 3600000 / 24),
        0
      )
      members.sort(
        (a, b) =>
          Date.parse(b.article.at) - Date.parse(a.article.at) ||
          a.article.id.localeCompare(b.article.id)
      )
      const rep = members[0] as (typeof members)[number]
      const sources = new Set<string>()
      const references = members
        .filter(({ article }) => {
          if (sources.has(article.source)) return false
          sources.add(article.source)
          return true
        })
        .slice(0, 3)
        .map(({ article }) => ({
          id: article.id,
          source: article.source,
          section: article.section,
          title: article.title,
          url: article.url
        }))
      return {
        eventId,
        title: rep.analysis.title,
        summary: rep.analysis.summary,
        heat: Math.round(rawHeat * 100) / 10,
        participants: participants.size,
        imageUrl: rep.article.imageUrl,
        references,
        rawHeat,
        latest: Date.parse(rep.article.at)
      }
    })
    .sort(
      (a, b) => b.rawHeat - a.rawHeat || b.latest - a.latest || a.eventId.localeCompare(b.eventId)
    )
  return {
    computedAt: cutoff,
    articleCount: articles.length,
    entries: ranked.slice(0, 5).map(({ rawHeat: _raw, latest: _latest, ...entry }) => entry)
  }
}

function tokens(title: string) {
  const value = title.normalize('NFKC').toLowerCase()
  const out: string[] = [...(value.match(/[a-z][a-z0-9.+-]{2,}/g) ?? [])]
  for (const part of value.match(/[\p{Script=Han}]+/gu) ?? [])
    for (let i = 0; i < part.length - 1; i++) out.push(part.slice(i, i + 2))
  return new Set(out)
}
export function recallHotEvents(
  incoming: HotArticle[],
  articles: HotArticle[],
  analyses: HotAnalysis[]
): HotEventCandidate[] {
  const byId = new Map(articles.map((a) => [a.id, a]))
  const query = incoming.map((a) => tokens(a.title))
  const events = new Map<string, { score: number; titles: string[] }>()
  for (const row of analyses) {
    const article = byId.get(row.id)
    if (!article || !row.eventId) continue
    const words = tokens(`${article.title} ${row.title}`)
    const score = Math.max(
      ...query.map((q) => [...q].filter((t) => words.has(t)).length / Math.max(1, q.size))
    )
    if (score < 0.15) continue
    const old = events.get(row.eventId)
    events.set(row.eventId, {
      score: Math.max(score, old?.score ?? 0),
      titles: [...(old?.titles ?? []), article.title].slice(0, 3)
    })
  }
  return [...events]
    .sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]))
    .slice(0, 40)
    .map(([id, e]) => ({
      id,
      titles: e.titles.slice(0, 2).map((t) => Array.from(t).slice(0, 200).join(''))
    }))
}

export function makeHotBatch(
  pending: HotArticle[],
  articles: HotArticle[],
  analyses: HotAnalysis[]
): HotBatch {
  const batch = pending.slice(0, HOT_BATCH_SIZE)
  while (batch.length) {
    const input = { articles: batch, events: recallHotEvents(batch, articles, analyses) }
    if (new TextEncoder().encode(JSON.stringify(input)).byteLength <= 80 * 1024) return input
    batch.pop()
  }
  throw new Error('Hot batch exceeds input budget')
}
