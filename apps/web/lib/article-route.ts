import {
  findSignalSection,
  findSignalSource,
  listSignalSections,
  listSignalSources
} from '@rss-site/signals'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  if (!section || !section.hasArticles) return null
  return { source, section: { id: section.id, title: section.shortTitle } }
}

function createReadableSlug(title: string) {
  const normalized = title
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return Array.from(normalized).slice(0, 56).join('').replace(/-+$/g, '') || 'article'
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
