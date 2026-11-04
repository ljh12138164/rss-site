// Keep this protocol in sync with ai-base's daily-report/contract.ts (schema v1).
export const dailySections = ['ai', 'technology', 'news', 'social', 'finance', 'games'] as const
export type DailySection = (typeof dailySections)[number]
export type DailyStory = {
  id: string
  section: DailySection
  title: string
  summary: string
  sourceIds: string[]
}
export type DailyDraft = {
  overview: { text: string; sourceIds: string[] }
  headlineId: string | null
  stories: DailyStory[]
}
export type DailySource = {
  id: string
  source: string
  sourceName: string
  section: DailySection
  title: string
  url: string
  imageUrl: string | null
  publishedAt: string | null
  firstSeenAt: string
}
export type DailyReport = {
  reportDate: string
  title: string
  content: DailyDraft
  sources: DailySource[]
  windowStart: string
  windowEnd: string
  publishedAt: string
  storyCount: number
  sourceCount: number
}

export function isReportDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number(value.slice(0, 4)) >= 2000 &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  )
}

export function shanghaiDate(time: number | Date = Date.now()): string {
  return new Date(Number(time) + 8 * 3_600_000).toISOString().slice(0, 10)
}

export function reportWindow(date: string) {
  if (!isReportDate(date)) throw new Error('Invalid report date')
  const end = Date.parse(`${date}T00:00:00+08:00`)
  return {
    windowStart: new Date(end - 86_400_000).toISOString(),
    windowEnd: new Date(end).toISOString()
  }
}

export function safeDailyUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}

function object(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some((key) => !(key in value))
  )
    throw new Error('Invalid daily report object')
}
function text(value: unknown, max: number, empty = false): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim() !== value ||
    (!empty && !value) ||
    Array.from(value).length > max
  )
    throw new Error('Invalid daily report text')
}
function refs(value: unknown, max: number, empty = false): asserts value is string[] {
  if (
    !Array.isArray(value) ||
    (!empty && !value.length) ||
    value.length > max ||
    value.some((id) => typeof id !== 'string') ||
    new Set(value).size !== value.length
  )
    throw new Error('Invalid daily report references')
}

export function validateDailyDraft(
  value: unknown,
  sources: Pick<DailySource, 'id' | 'source' | 'section'>[]
): DailyDraft {
  object(value, ['overview', 'headlineId', 'stories'])
  object(value.overview, ['text', 'sourceIds'])
  text(value.overview.text, 400, true)
  refs(value.overview.sourceIds, 36, true)
  if (!Array.isArray(value.stories) || value.stories.length > 12)
    throw new Error('Invalid story count')
  if (!value.stories.length) {
    if (value.headlineId !== null || value.overview.text !== '' || value.overview.sourceIds.length)
      throw new Error('Invalid empty report')
    return value as DailyDraft
  }
  if (!value.overview.text || !value.overview.sourceIds.length || value.headlineId !== 's1')
    throw new Error('Invalid report overview or headline')
  const registry = new Map(sources.map((source) => [source.id, source]))
  const used = new Set<string>()
  const representatives = new Map<string, number>()
  for (const [index, story] of value.stories.entries()) {
    object(story, ['id', 'section', 'title', 'summary', 'sourceIds'])
    if (story.id !== `s${index + 1}` || !dailySections.includes(story.section as DailySection))
      throw new Error('Invalid story identity')
    text(story.title, 100)
    text(story.summary, 300)
    refs(story.sourceIds, 3)
    if (
      story.sourceIds.some((id) => !registry.has(id)) ||
      !story.sourceIds.some((id) => registry.get(id)?.section === story.section)
    )
      throw new Error('Unknown source or incompatible section')
    const representative = registry.get(story.sourceIds[0] ?? '')?.source
    if (!representative) throw new Error('Missing representative source')
    const count = (representatives.get(representative) ?? 0) + 1
    if (count > 2) throw new Error('Too many stories from one representative source')
    representatives.set(representative, count)
    for (const id of story.sourceIds) used.add(id)
  }
  if (value.overview.sourceIds.some((id) => !used.has(id)))
    throw new Error('Unselected overview source')
  return value as DailyDraft
}
