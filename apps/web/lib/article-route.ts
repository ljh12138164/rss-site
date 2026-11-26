import {
  findSignalSection,
  findSignalSource,
  listSignalSections,
  listSignalSources
} from '@rss-site/signals'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const percentEncodedPattern = /%[0-9a-f]{2}/i
const doubleEncodedPercentPattern = /%25/i
const MAX_SLUG_CHARS = 56
const MAX_DECODE_PASSES = 20
// Keep encoded article slug + `--<uuid>` (38 bytes) well under Linux NAME_MAX (255 bytes)
// including Next.js prerender cache suffixes such as `.segments` / `.prefetch.rsc`.
export const MAX_ENCODED_SLUG_PREFIX_BYTES = 160
export const MAX_ENCODED_ARTICLE_SLUG_BYTES = MAX_ENCODED_SLUG_PREFIX_BYTES + 38

export const articleSections = listSignalSections()
  .filter((section) => section.hasArticles)
  .map((section) => ({
    id: section.id,
    title: section.shortTitle,
    sources: listSignalSources({ section: section.id })
  }))

export function articleSource(sourceId: string) {
  const source = findSignalSource(sourceId)
  if (!source) return null
  const section = findSignalSection(source.section)
  if (!section?.hasArticles) return null
  return { source, section: { id: section.id, title: section.shortTitle } }
}

function createReadableSlug(title: string) {
  const normalized = title
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  let result = ''
  let chars = 0
  let encodedBytes = 0
  for (const char of normalized) {
    if (chars >= MAX_SLUG_CHARS) break
    const nextBytes = encodeURIComponent(char).length
    if (encodedBytes + nextBytes > MAX_ENCODED_SLUG_PREFIX_BYTES) break
    result += char
    chars += 1
    encodedBytes += nextBytes
  }
  return result.replace(/-+$/g, '') || 'article'
}

export function createNewsArticlePath(source: string, title: string, articleId: string) {
  return createArticlePath(source, title, articleId)
}

export function createArticlePath(source: string, title: string, articleId: string) {
  const entry = articleSource(source)
  if (!entry) throw new Error('Unknown article source')
  return `/${entry.section.id}/${encodeURIComponent(source)}/${createReadableSlug(title)}--${articleId.toLowerCase()}`
}

export function parseArticleIdFromSlug(slug: string) {
  const separator = slug.lastIndexOf('--')
  if (separator <= 0) return null

  const articleId = slug.slice(separator + 2)
  return uuidPattern.test(articleId) ? articleId.toLowerCase() : null
}

export type ArticleSlugNormalization =
  | { kind: 'ok'; id: string; slug: string }
  | { kind: 'redirect'; id: string; canonicalSlug: string; canonicalEncoded: string }
  | { kind: 'invalid' }

export function normalizeArticleSlugSegment(encodedSlug: string): ArticleSlugNormalization {
  const hadDoubleEncoding = doubleEncodedPercentPattern.test(encodedSlug)
  let decoded = encodedSlug
  let passes = 0

  while (passes < MAX_DECODE_PASSES) {
    let next: string
    try {
      next = decodeURIComponent(decoded)
    } catch {
      return { kind: 'invalid' }
    }
    passes += 1
    decoded = next
    if (!percentEncodedPattern.test(decoded)) break
  }

  if (percentEncodedPattern.test(decoded)) return { kind: 'invalid' }

  const id = parseArticleIdFromSlug(decoded)
  if (!id) return { kind: 'invalid' }

  const needsShortening =
    encodedSlug.length > MAX_ENCODED_ARTICLE_SLUG_BYTES ||
    encodeURIComponent(decoded).length > MAX_ENCODED_ARTICLE_SLUG_BYTES

  if (!hadDoubleEncoding && passes <= 1 && !needsShortening) {
    return { kind: 'ok', id, slug: decoded }
  }

  const rawPrefix = decoded.slice(0, decoded.lastIndexOf('--'))
  const canonicalSlug = `${createReadableSlug(rawPrefix)}--${id}`
  const canonicalEncoded = encodeURIComponent(canonicalSlug)
  if (canonicalEncoded === encodedSlug) {
    return { kind: 'ok', id, slug: canonicalSlug }
  }
  return { kind: 'redirect', id, canonicalSlug, canonicalEncoded }
}
