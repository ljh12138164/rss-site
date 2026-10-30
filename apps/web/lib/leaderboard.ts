import { cache } from 'react'

export interface ModelPricing {
  currency: string
  cached?: string
  input?: string
  output?: string
  rawText?: string
}

export interface ModelSubScore {
  score: string
  rank?: string
}

export interface ModelLeaderboardItem {
  slug: string
  name: string
  creator: string
  overallScore: string
  rank: number
  releasedAt: string
  coverage?: { count: number; percentage: number }
  scores: Record<string, ModelSubScore>
  pricing?: ModelPricing
  tags: string[]
  url: string
}

export interface BenchmarkEvidence {
  name: string
  evaluator: string
  rawScore: string
  capabilityScore: string
  rank?: string
  config?: string
  url?: string
}

export interface EvidenceSection {
  domain: string
  title: string
  score?: string
  count?: number
  benchmarks: BenchmarkEvidence[]
}

export interface ModelDetail {
  slug: string
  name: string
  creator: string
  overallScore: string
  rank: number
  releasedAt: string
  pricing?: ModelPricing
  coverage?: { count: number; percentage: number }
  scores: Record<string, ModelSubScore>
  evidenceSections: EvidenceSection[]
  unmeasuredBenchmarks: string[]
}

export const LEADERBOARD_CATEGORIES = [
  { id: 'overall', label: '综合' },
  { id: 'coding', label: '代码与编程' },
  { id: 'reasoning', label: '逻辑科研' },
  { id: 'professional', label: '专业办公 Agent' },
  { id: 'knowledge', label: '知识问答' }
] as const

export type LeaderboardCategoryId = (typeof LEADERBOARD_CATEGORIES)[number]['id']

const RSSHUB_BASE_URL =
  process.env.NEXT_PUBLIC_RSSHUB_URL || process.env.RSSHUB_BASE_URL || 'https://rss.ljhboard.cn'

function parseLeaderboardHtml(html: string) {
  const plainText = html.replace(/<[^>]+>/g, ' ')
  const coverageMatch = plainText.match(/评测覆盖[：:]\s*(\d+)\s*项评测\s*·\s*覆盖率\s*(\d+)%/)
  const coverage = coverageMatch
    ? { count: Number(coverageMatch[1]), percentage: Number(coverageMatch[2]) }
    : undefined

  const scores: Record<string, ModelSubScore> = {}
  const scoreRegex = /(编程|科研|专业办公|知识问答|真人盲选)[：:]\s*([\d.]+)分(?:\s*\(([^)]+)\))?/g
  let sm: RegExpExecArray | null = null
  while (true) {
    sm = scoreRegex.exec(plainText)
    if (!sm) break
    scores[sm[1]] = { score: sm[2], rank: sm[3] }
  }

  let pricing: ModelPricing | undefined
  if (!html.includes('暂无官方按量') && !html.includes('暂无官方价格')) {
    const cachedMatch = html.match(/缓存:\s*[¥$]([\d.]+)/)
    const inputMatch = html.match(/输入:\s*[¥$]([\d.]+)/)
    const outputMatch = html.match(/输出:\s*[¥$]([\d.]+)/)
    if (inputMatch || outputMatch || cachedMatch) {
      pricing = {
        currency: 'CNY',
        cached: cachedMatch ? Number(cachedMatch[1]).toFixed(2) : undefined,
        input: inputMatch ? Number(inputMatch[1]).toFixed(2) : undefined,
        output: outputMatch ? Number(outputMatch[1]).toFixed(2) : undefined
      }
    }
  }

  return { coverage, scores, pricing }
}

function parseModelDetailHtml(html: string): {
  benchmarks: BenchmarkEvidence[]
  unmeasured: string[]
} {
  const benchmarks: BenchmarkEvidence[] = []
  const unmeasured: string[] = []

  // Check for unmeasured list
  if (html.includes('尚未取得有效成绩') || html.includes('尚未成效')) {
    const liMatches = html.match(/<li>(.*?)<\/li>/g)
    if (liMatches) {
      for (const li of liMatches) {
        const text = li.replace(/<\/?li>/g, '').trim()
        if (text) unmeasured.push(text)
      }
    }
    return { benchmarks, unmeasured }
  }

  // Parse table rows
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
      benchmarks.push({
        url: nameMatch[1],
        name: nameMatch[2].trim(),
        evaluator: nameMatch[3].trim(),
        rawScore: tds[1] || '',
        capabilityScore: tds[2] || '',
        rank: tds[3] || undefined,
        config: tds[4] || undefined
      })
    }
  }

  return { benchmarks, unmeasured }
}

export const getModelLeaderboard = cache(
  async (category = 'overall'): Promise<ModelLeaderboardItem[]> => {
    const categoryPath = category === 'overall' ? '' : `/${category}`
    const endpoint = `${RSSHUB_BASE_URL}/aihot/leaderboard${categoryPath}?format=json`

    try {
      const res = await fetch(endpoint, {
        next: { revalidate: 14400 } // 4 hours
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${endpoint}`)
      }
      const data = await res.json()
      const items = (data.items || []) as {
        url: string
        title: string
        content_html: string
        date_published: string
        tags?: string[]
      }[]

      return items.map((item) => {
        const titleMatch = item.title.match(/\[No\.(\d+)\s+评分:\s*([\d.]+)\]\s+([^·]+)\s*·\s*(.+)/)
        const slug = item.url.split('/').pop() || ''
        const { coverage, scores, pricing } = parseLeaderboardHtml(item.content_html || '')

        return {
          slug,
          name: titleMatch ? titleMatch[3].trim() : item.title,
          creator: titleMatch ? titleMatch[4].trim() : 'AI Lab',
          overallScore: titleMatch ? titleMatch[2] : '0.0',
          rank: titleMatch ? Number(titleMatch[1]) : 0,
          releasedAt: item.date_published,
          coverage,
          scores,
          pricing,
          tags: item.tags || [],
          url: `/leaderboard/${slug}`
        }
      })
    } catch (err) {
      console.warn(`[leaderboard] Failed to fetch category ${category}:`, err)
      return []
    }
  }
)

export const getModelDetail = cache(async (slug: string): Promise<ModelDetail | null> => {
  const endpoint = `${RSSHUB_BASE_URL}/aihot/model/${slug}?format=json`

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 14400 }
    })
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`HTTP ${res.status} from ${endpoint}`)
    }
    const data = await res.json()
    const items = (data.items || []) as {
      title: string
      content_html: string
      date_published: string
      tags?: string[]
    }[]

    if (!items.length) return null

    // Item 0 is overview
    const overview = items[0]
    const overviewMatch = overview.title.match(/综合评分\s*([\d.]+)\s*\(第\s*(\d+)\s*名\)/)
    const nameMatch = overview.title.match(/【总览】\s*(.+?)\s*综合评分/)
    const { coverage, scores, pricing } = parseLeaderboardHtml(overview.content_html || '')

    const creator = overview.tags?.find((t) => t !== '总览') || 'AI Lab'
    const name = nameMatch ? nameMatch[1].trim() : slug

    const evidenceSections: EvidenceSection[] = []
    let unmeasuredBenchmarks: string[] = []

    // Items 1..n
    for (let i = 1; i < items.length; i++) {
      const sectionItem = items[i]
      const { benchmarks, unmeasured } = parseModelDetailHtml(sectionItem.content_html || '')
      if (unmeasured.length) {
        unmeasuredBenchmarks = unmeasured
      } else if (benchmarks.length) {
        const domainTag = sectionItem.tags?.[0] || '评测'
        const scoreMatch = sectionItem.title.match(/得分:\s*([\d.]+)\s*分/)
        evidenceSections.push({
          domain: domainTag,
          title: sectionItem.title.replace(/【.*?】/, '').trim(),
          score: scoreMatch ? scoreMatch[1] : undefined,
          count: benchmarks.length,
          benchmarks
        })
      }
    }

    return {
      slug,
      name,
      creator,
      overallScore: overviewMatch ? overviewMatch[1] : '0.0',
      rank: overviewMatch ? Number(overviewMatch[2]) : 1,
      releasedAt: overview.date_published,
      pricing,
      coverage,
      scores,
      evidenceSections,
      unmeasuredBenchmarks
    }
  } catch (err) {
    console.warn(`[leaderboard] Failed to fetch model detail ${slug}:`, err)
    return null
  }
})
