const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologySources
} from './technology-sources'

export const articleSections = [
  { id: 'ai', title: 'AI', sources: aiSources },
  { id: 'technology', title: '科技', sources: technologySources },
  { id: 'news', title: '新闻', sources: newsSources },
  { id: 'social', title: '社交', sources: socialSources },
  { id: 'finance', title: '财经', sources: financeSources },
  { id: 'games', title: '游戏', sources: gameSources }
] as const

export function articleSource(sourceId: string) {
  for (const section of articleSections) {
    const source = section.sources.find((entry) => entry.id === sourceId)
    if (source) return { source, section }
  }
  return null
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
