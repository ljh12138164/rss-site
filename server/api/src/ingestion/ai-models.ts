import { sql } from 'drizzle-orm'
import type { Database } from '../db/client.js'
import { aiLeaderboardRanks, aiModelEvidences, aiModelPrices, aiModels } from '../db/schema.js'

export interface IngestAiModelsOptions {
  db: Database
  rsshubBaseUrl: string
  fetchFn?: typeof fetch
  maxModels?: number
}

export interface IngestAiModelsResult {
  batchId: string
  modelCount: number
  priceCount: number
  rankCount: number
  evidenceCount: number
  durationMs: number
}

const CATEGORIES = [
  { id: 'overall', path: '' },
  { id: 'coding', path: '/coding' },
  { id: 'reasoning', path: '/reasoning' },
  { id: 'professional', path: '/professional' },
  { id: 'knowledge', path: '/knowledge' }
] as const

interface ParsedLeaderboardItem {
  slug: string
  name: string
  creator: string
  overallScore: string
  rank: number
  releasedAt: Date | null
  pricing?: {
    cached?: string
    input?: string
    output?: string
  }
}

interface ParsedBenchmarkEvidence {
  sourceKey: string
  name: string
  evaluator: string
  domain: string
  rawScore: string
  capabilityScore: string
  config?: string
  sourceUrl?: string
}

function parseLeaderboardItem(item: {
  url: string
  title: string
  content_html?: string
  date_published?: string
}): ParsedLeaderboardItem | null {
  const titleMatch = item.title.match(/\[No\.(\d+)\s+评分:\s*([\d.]+)\]\s+([^·]+)\s*·\s*(.+)/)
  const slug = item.url.split('/').pop() || ''
  if (!slug) return null

  const html = item.content_html || ''
  let pricing: ParsedLeaderboardItem['pricing'] | undefined
  if (!html.includes('暂无官方按量') && !html.includes('暂无官方价格')) {
    const cachedMatch = html.match(/缓存:\s*[¥$]([\d.]+)/)
    const inputMatch = html.match(/输入:\s*[¥$]([\d.]+)/)
    const outputMatch = html.match(/输出:\s*[¥$]([\d.]+)/)
    if (inputMatch || outputMatch || cachedMatch) {
      pricing = {
        cached: cachedMatch ? Number(cachedMatch[1]).toFixed(2) : undefined,
        input: inputMatch ? Number(inputMatch[1]).toFixed(2) : undefined,
        output: outputMatch ? Number(outputMatch[1]).toFixed(2) : undefined
      }
    }
  }

  const releasedAt = item.date_published ? new Date(item.date_published) : null

  return {
    slug,
    name: titleMatch ? titleMatch[3].trim() : item.title,
    creator: titleMatch ? titleMatch[4].trim() : 'AI Lab',
    overallScore: titleMatch ? titleMatch[2] : '0.0',
    rank: titleMatch ? Number(titleMatch[1]) : 0,
    releasedAt: Number.isNaN(releasedAt?.getTime() ?? NaN) ? null : releasedAt,
    pricing
  }
}

function parseModelEvidences(
  items: {
    title: string
    content_html?: string
    tags?: string[]
  }[]
): ParsedBenchmarkEvidence[] {
  const evidences: ParsedBenchmarkEvidence[] = []

  for (let i = 1; i < items.length; i++) {
    const sectionItem = items[i]
    const html = sectionItem.content_html || ''
    if (html.includes('尚未取得有效成绩') || html.includes('尚未成效')) {
      continue
    }

    const domain = sectionItem.tags?.[0] || '评测'
    const trRegex = /<tr style="border-bottom: 1px solid #eee;">([\s\S]*?)<\/tr>/g
    let trMatch: RegExpExecArray | null = null

    while (true) {
      trMatch = trRegex.exec(html)
      if (!trMatch) break
      const rowHtml = trMatch[1]
      const nameMatch = rowHtml.match(
        /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<small[^>]*>([\s\S]*?)<\/small>/
      )
      const tds = Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map((m) =>
        m[1].replace(/<[^>]+>/g, '').trim()
      )

      if (nameMatch && tds.length >= 3) {
        const sourceUrl = nameMatch[1]
        const sourceKey =
          sourceUrl.split('/').pop() || nameMatch[2].trim().toLowerCase().replace(/\s+/g, '-')

        evidences.push({
          sourceKey,
          name: nameMatch[2].trim(),
          evaluator: nameMatch[3].trim(),
          domain,
          rawScore: tds[1] || '',
          capabilityScore: tds[2] || '',
          config: tds[4] || undefined,
          sourceUrl
        })
      }
    }
  }

  return evidences
}

async function fetchJsonWithFallback(url: string, timeoutMs = 8000): Promise<unknown> {
  const hasProxy = Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY)
  if (hasProxy) {
    try {
      const { execFileSync } = await import('node:child_process')
      const stdout = execFileSync('curl.exe', ['-s', '--fail', url], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024
      })
      return JSON.parse(stdout)
    } catch {
      // fallback to fetch if curl failed
    }
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fall back to curl when native fetch encounters proxy/handshake issues on Windows
  }

  try {
    const { execFileSync } = await import('node:child_process')
    const stdout = execFileSync('curl.exe', ['-s', '--fail', url], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    })
    return JSON.parse(stdout)
  } catch (err) {
    throw new Error(`Failed to fetch ${url} via both fetch and curl: ${err}`)
  }
}

export async function ingestAiModels(
  options: IngestAiModelsOptions
): Promise<IngestAiModelsResult> {
  const startTime = Date.now()
  const baseUrl = options.rsshubBaseUrl.replace(/\/$/, '')
  const batchId = crypto.randomUUID()
  const now = new Date()

  // 1. Fetch overall leaderboard
  const overallFeed = (await fetchJsonWithFallback(`${baseUrl}/aihot/leaderboard?format=json`)) as {
    items?: Array<{
      url: string
      title: string
      content_html?: string
      date_published?: string
    }>
  }
  const rawItems = (overallFeed.items || []).slice(0, options.maxModels || 30)

  const models: ParsedLeaderboardItem[] = []
  for (const raw of rawItems) {
    const parsed = parseLeaderboardItem(raw)
    if (parsed) models.push(parsed)
  }

  if (models.length === 0) {
    throw new Error('No models found in leaderboard feed')
  }

  // 2. Fetch category leaderboards to collect sub-ranks
  const categoryRanks: {
    category: string
    modelSlug: string
    rank: number
    score: string
  }[] = []

  // Add overall ranks
  for (const m of models) {
    categoryRanks.push({
      category: 'overall',
      modelSlug: m.slug,
      rank: m.rank,
      score: m.overallScore
    })
  }

  for (const cat of CATEGORIES) {
    if (cat.id === 'overall') continue
    try {
      const data = (await fetchJsonWithFallback(
        `${baseUrl}/aihot/leaderboard${cat.path}?format=json`
      )) as {
        items?: Array<{
          url: string
          title: string
          content_html?: string
          date_published?: string
        }>
      }
      const catItems = data.items || []
      for (const item of catItems) {
        const parsed = parseLeaderboardItem(item)
        if (parsed) {
          categoryRanks.push({
            category: cat.id,
            modelSlug: parsed.slug,
            rank: parsed.rank,
            score: parsed.overallScore
          })
        }
      }
    } catch (e) {
      console.warn(`[ingest-ai-models] Warning: failed to fetch category ${cat.id}:`, e)
    }
  }

  // 3. Fetch evidence chains in memory first so DB connection isn't held idle
  const allEvidences: { modelSlug: string; ev: ParsedBenchmarkEvidence }[] = []
  for (const model of models) {
    try {
      const detailData = (await fetchJsonWithFallback(
        `${baseUrl}/aihot/model/${model.slug}?format=json`
      )) as {
        items?: Array<{
          title: string
          content_html?: string
          tags?: string[]
        }>
      }
      const evidences = parseModelEvidences(detailData.items || [])
      for (const ev of evidences) {
        allEvidences.push({ modelSlug: model.slug, ev })
      }
    } catch (e) {
      console.warn(`[ingest-ai-models] Could not fetch detail for ${model.slug}:`, e)
    }
  }

  // 4. Batch/sequential database operations
  for (const model of models) {
    await options.db
      .insert(aiModels)
      .values({
        slug: model.slug,
        name: model.name,
        creator: model.creator,
        overallScore: model.overallScore,
        releasedAt: model.releasedAt,
        firstSeenAt: now,
        lastSeenAt: now
      })
      .onConflictDoUpdate({
        target: aiModels.slug,
        set: {
          name: sql`excluded.name`,
          creator: sql`excluded.creator`,
          overallScore: sql`excluded.overall_score`,
          releasedAt: sql`excluded.released_at`,
          lastSeenAt: now
        }
      })
  }

  // 5. Upsert into ai_model_prices
  let priceCount = 0
  for (const model of models) {
    if (model.pricing) {
      await options.db.insert(aiModelPrices).values({
        modelSlug: model.slug,
        currency: 'CNY',
        inputPricePerMillion: model.pricing.input || null,
        outputPricePerMillion: model.pricing.output || null,
        cachedInputPricePerMillion: model.pricing.cached || null,
        updatedAt: now
      })
      priceCount++
    }
  }

  // 6. Upsert into ai_leaderboard_ranks
  let rankCount = 0
  for (const r of categoryRanks) {
    if (models.some((m) => m.slug === r.modelSlug)) {
      await options.db
        .insert(aiLeaderboardRanks)
        .values({
          modelSlug: r.modelSlug,
          category: r.category,
          rank: r.rank,
          score: r.score,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [aiLeaderboardRanks.category, aiLeaderboardRanks.modelSlug],
          set: {
            rank: sql`excluded.rank`,
            score: sql`excluded.score`,
            updatedAt: now
          }
        })
      rankCount++
    }
  }

  // 7. Insert all evidences
  let evidenceCount = 0
  for (const item of allEvidences) {
    await options.db.insert(aiModelEvidences).values({
      modelSlug: item.modelSlug,
      sourceKey: item.ev.sourceKey,
      benchmarkName: item.ev.name,
      evaluator: item.ev.evaluator,
      domain: item.ev.domain,
      rawScore: item.ev.rawScore,
      capabilityScore: item.ev.capabilityScore,
      reasoningTier: item.ev.config || null,
      sourceUrl: item.ev.sourceUrl || null,
      updatedAt: now
    })
    evidenceCount++
  }

  return {
    batchId,
    modelCount: models.length,
    priceCount,
    rankCount,
    evidenceCount,
    durationMs: Date.now() - startTime
  }
}
