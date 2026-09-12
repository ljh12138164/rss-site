import { XMLParser, XMLValidator } from 'fast-xml-parser'

export interface TechnologyFeedItem {
  sourceKey: string
  title: string
  url: string
  imageUrl: string | null
  summary: string | null
  contentHtml?: string | null
  author: string | null
  publishedAt: Date | null
  position: number
}

interface ParsedItem {
  title?: unknown
  link?: unknown
  guid?: unknown
  description?: unknown
  'content:encoded'?: unknown
  author?: unknown
  pubDate?: unknown
}

interface ParseFeedOptions {
  titleFromFirstStrong?: boolean
  urlFromFirstAnchor?: boolean
}

interface ParsedRss {
  rss?: {
    channel?: {
      item?: ParsedItem[]
    }
  }
}

function textValue(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim()
    return text || null
  }

  if (value && typeof value === 'object' && '#text' in value) {
    return textValue((value as { '#text': unknown })['#text'])
  }

  return null
}

function canonicalWebUrl(value: unknown): string | null {
  const rawUrl = textValue(value)
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key)
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"'
  }

  return value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
    if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
    if (code.startsWith('#')) return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
    return named[code.toLowerCase()] ?? entity
  })
}

function plainText(value: unknown): string | null {
  const html = textValue(value)
  if (!html) return null

  const text = decodeEntities(
    html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()

  return text || null
}

function firstStrongText(value: unknown): string | null {
  const html = textValue(value)
  if (!html) return null

  const match = html.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i)
  return match ? plainText(match[1]) : null
}

function firstAnchorUrl(value: unknown, baseUrl: unknown): string | null {
  const html = textValue(value)
  const base = textValue(baseUrl)
  if (!html || !base) return null

  const href = html.match(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)
  const rawUrl = href?.[1] ?? href?.[2] ?? href?.[3]
  if (!rawUrl) return null

  try {
    return canonicalWebUrl(new URL(decodeEntities(rawUrl), base).toString())
  } catch {
    return null
  }
}

function firstImageUrl(...values: unknown[]): string | null {
  for (const value of values) {
    const html = textValue(value)
    if (!html) continue

    const match = html.match(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)
    const rawImageUrl = match?.[1] ?? match?.[2] ?? match?.[3]
    if (!rawImageUrl) continue

    const imageUrl = canonicalWebUrl(decodeEntities(rawImageUrl))
    if (imageUrl) return imageUrl
  }

  return null
}

function publishedDate(value: unknown): Date | null {
  const text = textValue(value)
  if (!text) return null

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseTechnologyFeed(
  xml: string,
  sourceName: string,
  options: ParseFeedOptions = {}
): TechnologyFeedItem[] {
  const validation = XMLValidator.validate(xml)
  if (validation !== true) throw new Error('RSSHub returned invalid XML')

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (_name, path) => path === 'rss.channel.item'
  })
  const parsed = parser.parse(xml) as ParsedRss
  const items = parsed.rss?.channel?.item ?? []
  if (items.length === 0) throw new Error(`RSSHub returned an empty ${sourceName} feed`)

  const usableItems = items.flatMap((item) => {
    const content = item['content:encoded']
    const rawTitle =
      (options.titleFromFirstStrong ? firstStrongText(content) : null) ?? textValue(item.title)
    const title = rawTitle ? decodeEntities(rawTitle) : null
    const url =
      (options.urlFromFirstAnchor ? firstAnchorUrl(content, item.link) : null) ??
      canonicalWebUrl(item.link)
    if (!title || !url) return []

    const rawGuid = textValue(item.guid)
    // Feed HTML is archived as untrusted content; the reader sanitizes it before rendering.
    const html = textValue(content) ?? textValue(item.description)
    const contentHtml = html && Buffer.byteLength(html, 'utf8') <= 512 * 1024 ? html : null
    return [
      {
        sourceKey: canonicalWebUrl(rawGuid) ?? rawGuid ?? url,
        title,
        url,
        imageUrl: firstImageUrl(item.description, content),
        summary: (plainText(item.description) ?? plainText(content))?.slice(0, 500) ?? null,
        contentHtml,
        author: textValue(item.author),
        publishedAt: publishedDate(item.pubDate)
      }
    ]
  })

  if (usableItems.length === 0) {
    throw new Error(`${sourceName} feed contains no usable items`)
  }

  return usableItems.map((item, index) => ({ ...item, position: index + 1 }))
}
