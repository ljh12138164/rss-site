const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function createReadableSlug(title: string) {
  const normalized = title
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return Array.from(normalized).slice(0, 56).join('').replace(/-+$/g, '') || 'article'
}

export function createNewsArticlePath(source: string, title: string, articleId: string) {
  return `/news/${encodeURIComponent(source)}/${createReadableSlug(title)}--${articleId.toLowerCase()}`
}

export function parseArticleIdFromSlug(slug: string) {
  const separator = slug.lastIndexOf('--')
  if (separator <= 0) return null

  const articleId = slug.slice(separator + 2)
  return uuidPattern.test(articleId) ? articleId.toLowerCase() : null
}
