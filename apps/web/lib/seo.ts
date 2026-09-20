import type { Metadata } from 'next'
import { optionalCanonical } from './site-url'

export const SITE_NAME = '今日热点'
export const SITE_ALTERNATE_NAME = 'AI 热榜'
export const SITE_DESCRIPTION = '每日聚合 AI、科技、新闻、社交、财经与游戏热点。'

export function toMetaDescription(value: string | null | undefined, limit = 160) {
  if (!value) return undefined
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized

  const candidate = normalized.slice(0, limit)
  const sentenceEnd = Math.max(
    candidate.lastIndexOf('。'),
    candidate.lastIndexOf('！'),
    candidate.lastIndexOf('？'),
    candidate.lastIndexOf('.'),
    candidate.lastIndexOf('!'),
    candidate.lastIndexOf('?')
  )
  if (sentenceEnd >= Math.min(24, Math.floor(limit / 2))) {
    return candidate.slice(0, sentenceEnd + 1)
  }

  const wordEnd = candidate.lastIndexOf(' ')
  const end = wordEnd >= Math.floor(limit * 0.65) ? wordEnd : limit - 1
  return `${candidate.slice(0, end).trimEnd()}…`
}

export function createPageMetadata({
  title,
  description,
  path,
  type = 'website',
  publishedTime,
  modifiedTime
}: {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}): Metadata {
  const canonical = optionalCanonical(path)
  const openGraph =
    type === 'article'
      ? {
          type,
          title,
          description,
          url: canonical,
          siteName: SITE_NAME,
          locale: 'zh_CN',
          publishedTime,
          modifiedTime
        }
      : {
          type,
          title,
          description,
          url: canonical,
          siteName: SITE_NAME,
          locale: 'zh_CN'
        }

  return {
    title,
    description,
    alternates: { canonical },
    openGraph,
    twitter: { card: 'summary', title, description }
  }
}

export function createHomepageStructuredData(canonical: string) {
  const homepage = new URL('/', canonical).toString()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${homepage}#website`,
        url: homepage,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        inLanguage: 'zh-CN'
      },
      {
        '@type': 'CollectionPage',
        '@id': `${homepage}#webpage`,
        url: homepage,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        isPartOf: { '@id': `${homepage}#website` },
        inLanguage: 'zh-CN'
      }
    ]
  }
}

type ArticleSchemaInput = {
  type: 'Article' | 'NewsArticle' | 'TechArticle'
  canonical: string
  title: string
  description?: string
  sourceUrl: string
  sourceName: string
  sectionName: string
  sectionPath: string
  sourcePath: string
  publishedAt?: string
  modifiedAt: string
  author?: string
  language: 'en' | 'zh-CN'
}

export function createArticleStructuredData(input: ArticleSchemaInput) {
  const homepage = new URL('/', input.canonical).toString()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': input.type,
        '@id': `${input.canonical}#article`,
        headline: input.title,
        ...(input.description ? { description: input.description } : {}),
        url: input.canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': input.canonical },
        articleSection: input.sectionName,
        inLanguage: input.language,
        ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
        dateModified: input.modifiedAt,
        isAccessibleForFree: true,
        isBasedOn: input.sourceUrl,
        citation: input.sourceUrl,
        provider: { '@type': 'Organization', name: input.sourceName },
        ...(input.author ? { author: { '@type': 'Person', name: input.author } } : {})
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${input.canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: homepage },
          {
            '@type': 'ListItem',
            position: 2,
            name: input.sectionName,
            item: new URL(input.sectionPath, homepage).toString()
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: input.sourceName,
            item: new URL(input.sourcePath, homepage).toString()
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: input.title,
            item: input.canonical
          }
        ]
      }
    ]
  }
}

export function createEventStructuredData({
  canonical,
  title,
  description,
  publishedAt,
  modifiedAt,
  language,
  citations
}: {
  canonical: string
  title: string
  description: string
  publishedAt: string
  modifiedAt: string
  language: 'en' | 'zh-CN'
  citations: string[]
}) {
  const homepage = new URL('/', canonical).toString()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: title,
        description,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        datePublished: publishedAt,
        dateModified: modifiedAt,
        inLanguage: language,
        about: { '@type': 'Thing', name: '人工智能' },
        isAccessibleForFree: true,
        citation: citations
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: homepage },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI 时间轴',
            item: new URL('/ai/events', homepage).toString()
          },
          { '@type': 'ListItem', position: 3, name: title, item: canonical }
        ]
      }
    ]
  }
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
