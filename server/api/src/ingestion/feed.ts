import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { cleanCmsTemplateTags, cleanFeedArticleHtml } from '../../../../shared/openai-content.js'

export interface SignalFeedItem {
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

export type TechnologyFeedItem = SignalFeedItem

interface ParsedItem {
  title?: unknown
  link?: unknown
  guid?: unknown
  id?: unknown
  description?: unknown
  summary?: unknown
  content?: unknown
  'content:encoded'?: unknown
  enclosure?: unknown
  author?: unknown
  pubDate?: unknown
  published?: unknown
  updated?: unknown
}

export interface ParseSignalFeedOptions {
  useUpdatedDate?: boolean
  titleFromFirstStrong?: boolean
  urlFromFirstAnchor?: boolean
  skillMetadata?: boolean
}

export type ParseFeedOptions = ParseSignalFeedOptions

interface ParsedFeed {
  rss?: {
    channel?: {
      item?: ParsedItem[]
    }
  }
  feed?: {
    entry?: ParsedItem[]
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

function extractLinkUrl(value: unknown): string | null {
  if (Array.isArray(value)) {
    const alternate = value.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        (item['@_rel'] === 'alternate' || !item['@_rel']) &&
        item['@_href']
    )
    if (alternate) return canonicalWebUrl(alternate['@_href'])
    const firstWithHref = value.find((item) => item && typeof item === 'object' && item['@_href'])
    if (firstWithHref) return canonicalWebUrl(firstWithHref['@_href'])
  }

  if (value && typeof value === 'object' && '@_href' in value) {
    return canonicalWebUrl((value as { '@_href': unknown })['@_href'])
  }

  return canonicalWebUrl(value)
}

function extractAuthor(value: unknown): string | null {
  if (value && typeof value === 'object') {
    if ('name' in value) return textValue((value as { name: unknown }).name)
    if ('#text' in value) return textValue((value as { '#text': unknown })['#text'])
  }
  return textValue(value)
}

function canonicalSourceKey(rawGuid: string | null, url: string): string {
  if (!rawGuid) return url

  try {
    const parsed = new URL(rawGuid)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      for (const key of [...parsed.searchParams.keys()]) {
        if (key.toLowerCase().startsWith('utm_')) parsed.searchParams.delete(key)
      }
      if (!parsed.hash) {
        return parsed.toString().replace(/\/$/, '')
      }
      return parsed.toString()
    }
    return rawGuid
  } catch {
    return rawGuid
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

  const cleaned = cleanCmsTemplateTags(html)
  const text = decodeEntities(
    cleaned.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
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

function skillSummary(value: unknown): string | null {
  const html = textValue(value)
  if (!html) return null

  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => plainText(match[1]))
    .filter((paragraph): paragraph is string => Boolean(paragraph))
  if (paragraphs.length === 0) return plainText(html)?.slice(0, 500) ?? null

  const description = paragraphs[0] ?? ''
  const metadata = paragraphs
    .slice(1)
    .filter((paragraph) =>
      /^(?:Installs|Source|Source type|Hourly change|Same hour yesterday):/i.test(paragraph)
    )
  const suffix = metadata.length > 0 ? ` · ${metadata.join(' · ')}` : ''
  return `${description.slice(0, Math.max(0, 500 - suffix.length))}${suffix}`
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

function resolveImageUrl(value: unknown, baseUrl: string): string | null {
  const rawUrl = textValue(value)
  if (!rawUrl) return null
  try {
    return canonicalWebUrl(new URL(decodeEntities(rawUrl), baseUrl).toString())
  } catch {
    return null
  }
}

function imageEnclosureUrl(value: unknown, baseUrl: string): string | null {
  for (const enclosure of Array.isArray(value) ? value : [value]) {
    if (!enclosure || typeof enclosure !== 'object' || !('@_type' in enclosure)) continue
    const type = textValue(enclosure['@_type'])
    if (!type?.toLowerCase().startsWith('image/') || !('@_url' in enclosure)) continue
    const imageUrl = resolveImageUrl(enclosure['@_url'], baseUrl)
    if (imageUrl) return imageUrl
  }
  return null
}

function firstImageUrl(baseUrl: string, ...values: unknown[]): string | null {
  for (const value of values) {
    const html = textValue(value)
    if (!html) continue

    for (const match of html.matchAll(
      /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi
    )) {
      const imageUrl = resolveImageUrl(match[1] ?? match[2] ?? match[3], baseUrl)
      if (imageUrl) return imageUrl
    }
  }

  return null
}

function publishedDate(value: unknown): Date | null {
  const text = textValue(value)
  if (!text) return null

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseSignalFeed(
  xml: string,
  sourceName: string,
  options: ParseSignalFeedOptions = {}
): SignalFeedItem[] {
  const validation = XMLValidator.validate(xml)
  if (validation !== true) throw new Error('RSSHub returned invalid XML')

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (_name, path) => path === 'rss.channel.item' || path === 'feed.entry'
  })
  const parsed = parser.parse(xml) as ParsedFeed
  const items = parsed.rss?.channel?.item ?? parsed.feed?.entry ?? []
  if (items.length === 0) throw new Error(`Feed parser returned an empty ${sourceName} feed`)

  const usableItems = items.flatMap((item) => {
    const content = item['content:encoded'] ?? item.content
    const rawDescription = item.description ?? item.summary
    const rawTitle =
      (options.titleFromFirstStrong ? firstStrongText(content) : null) ?? textValue(item.title)
    const title = rawTitle ? decodeEntities(rawTitle) : null
    const url =
      (options.urlFromFirstAnchor ? firstAnchorUrl(content, item.link) : null) ??
      extractLinkUrl(item.link)
    if (!title || !url) return []

    const rawGuid = textValue(item.id ?? item.guid)
    // Feed HTML is archived as untrusted content; the reader sanitizes it before rendering.
    const rawHtml = textValue(content) ?? textValue(rawDescription)
    const html = rawHtml ? cleanFeedArticleHtml(rawHtml, url) : null
    const contentHtml = html && Buffer.byteLength(html, 'utf8') <= 512 * 1024 ? html : null
    return [
      {
        sourceKey: canonicalSourceKey(rawGuid, url),
        title,
        url,
        imageUrl:
          imageEnclosureUrl(item.enclosure, url) ?? firstImageUrl(url, rawDescription, content),
        summary: options.skillMetadata
          ? skillSummary(rawDescription)
          : ((
              plainText(cleanFeedArticleHtml(textValue(rawDescription) ?? '', url)) ??
              plainText(html)
            )?.slice(0, 500) ?? null),
        contentHtml,
        author: extractAuthor(item.author),
        publishedAt: publishedDate(
          item.pubDate ??
            item.published ??
            (options.useUpdatedDate === false ? undefined : item.updated)
        )
      }
    ]
  })

  if (usableItems.length === 0) {
    throw new Error(`${sourceName} feed contains no usable items`)
  }

  return usableItems.map((item, index) => ({ ...item, position: index + 1 }))
}

export const parseTechnologyFeed = parseSignalFeed
