import type { Metadata } from 'next'
import sanitizeHtml from 'sanitize-html'
import { optionalCanonical } from './site-url'

export const SITE_NAME = '今日热点'
export const SITE_ALTERNATE_NAME = 'AI 热榜'
export const SITE_DESCRIPTION = '每日聚合 AI、科技、新闻、社交、财经与游戏热点。'
export const SITE_AUTHOR_NAME = 'LJH'
export const SITE_AUTHOR_URL = 'https://blog.ljhboard.cn/'
export const SITE_REPOSITORY_URL = 'https://github.com/ljh12138164/rss-site'
export const SITE_SAME_AS = [
  SITE_REPOSITORY_URL,
  'https://github.com/ljh12138164',
  SITE_AUTHOR_URL,
  'https://software.ljhboard.cn/',
  'https://tools.ljhboard.cn/',
  'https://token.ljhboard.cn/'
] as const
export const HOMEPAGE_PUBLISHED_AT = '2026-09-01T00:00:00+08:00'
export const HOMEPAGE_CITATIONS = [
  'https://www.rssboard.org/rss-specification',
  'https://www.rfc-editor.org/rfc/rfc4287',
  'https://modelcontextprotocol.io/specification',
  'https://llmstxt.org/'
] as const
export function articleDescription(summary: string | null, body: string) {
  const text = sanitizeHtml(body.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, ' '), {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return toMetaDescription(summary?.trim() || text)
}

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

export function createHomepageStructuredData(canonical: string, modifiedAt?: string) {
  const homepage = new URL('/', canonical).toString()
  const organizationId = `${homepage}#organization`
  const authorId = `${homepage}#author`
  const websiteId = `${homepage}#website`
  const webpageId = `${homepage}#webpage`
  const dateModified = modifiedAt ?? new Date().toISOString()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: homepage,
        logo: new URL('/icon.svg', homepage).toString(),
        sameAs: [...SITE_SAME_AS],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          url: new URL('/about#contact', homepage).toString()
        }
      },
      {
        '@type': 'Person',
        '@id': authorId,
        name: SITE_AUTHOR_NAME,
        url: SITE_AUTHOR_URL,
        sameAs: ['https://github.com/ljh12138164', SITE_AUTHOR_URL]
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: homepage,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { '@id': organizationId },
        author: { '@id': authorId },
        sameAs: [...SITE_SAME_AS],
        inLanguage: 'zh-CN'
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: homepage,
        name: SITE_NAME,
        headline: '今天的热点，在这里看。',
        description: SITE_DESCRIPTION,
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
        author: { '@id': authorId },
        publisher: { '@id': organizationId },
        datePublished: HOMEPAGE_PUBLISHED_AT,
        dateModified,
        citation: [...HOMEPAGE_CITATIONS],
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

export interface StructuredFaqItem {
  question: string
  answer: string
}

export function createDailyReportStructuredData({
  canonical,
  reportDate,
  title,
  description,
  publishedAt,
  citations
}: {
  canonical: string
  reportDate: string
  title: string
  description: string
  publishedAt: string
  citations: string[]
}) {
  const homepage = new URL('/', canonical).toString()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: `${reportDate} 日报 · ${title}`,
        description,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        datePublished: publishedAt,
        dateModified: publishedAt,
        inLanguage: 'zh-CN',
        isAccessibleForFree: true,
        author: { '@type': 'Person', name: SITE_AUTHOR_NAME, url: SITE_AUTHOR_URL },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: homepage,
          logo: new URL('/icon.svg', homepage).toString()
        },
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
            name: '今日日报',
            item: new URL('/daily', homepage).toString()
          },
          { '@type': 'ListItem', position: 3, name: `${reportDate} 日报`, item: canonical }
        ]
      }
    ]
  }
}

export function createLeaderboardStructuredData({
  canonical,
  updatedAt,
  models,
  faqItems
}: {
  canonical: string
  updatedAt: string
  models: { name: string; slug: string; creator: string; overallScore: string; rank: number }[]
  faqItems: StructuredFaqItem[]
}) {
  const homepage = new URL('/', canonical).toString()
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Dataset',
      '@id': `${canonical}#dataset`,
      name: 'AI 大模型公开基准评测排行榜',
      description:
        '覆盖综合能力、代码编程、逻辑科研、专业办公 Agent 与知识问答维度的前沿 AI 大模型公开基准排行榜，每 4 小时同步更新。',
      url: canonical,
      inLanguage: 'zh-CN',
      isAccessibleForFree: true,
      dateModified: updatedAt,
      creator: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: homepage
      }
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#list`,
      name: 'AI 模型综合评测排行',
      numberOfItems: models.length,
      itemListElement: models.slice(0, 20).map((model, index) => ({
        '@type': 'ListItem',
        position: model.rank || index + 1,
        name: `${model.name}（${model.creator} · ${model.overallScore} 分）`,
        url: new URL(`/leaderboard/${model.slug}`, homepage).toString()
      }))
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: homepage },
        { '@type': 'ListItem', position: 2, name: 'AI 模型评测榜', item: canonical }
      ]
    }
  ]

  if (faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      url: `${canonical}#faq`,
      inLanguage: 'zh-CN',
      dateModified: updatedAt,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

export function createModelDetailStructuredData({
  canonical,
  name,
  creator,
  description,
  releasedAt,
  modifiedAt
}: {
  canonical: string
  name: string
  creator: string
  description: string
  releasedAt?: string
  modifiedAt: string
}) {
  const homepage = new URL('/', canonical).toString()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${canonical}#article`,
        headline: `${name} 评测成绩与证据链`,
        description,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        ...(releasedAt ? { datePublished: releasedAt } : {}),
        dateModified: modifiedAt,
        inLanguage: 'zh-CN',
        isAccessibleForFree: true,
        about: { '@type': 'Thing', name: `${creator} ${name}` },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: homepage
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: homepage },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI 模型评测榜',
            item: new URL('/leaderboard', homepage).toString()
          },
          { '@type': 'ListItem', position: 3, name, item: canonical }
        ]
      }
    ]
  }
}

export function createSkillStructuredData({
  canonical,
  name,
  description,
  source,
  installUrl,
  upstreamUrl,
  publishedAt,
  modifiedAt
}: {
  canonical: string
  name: string
  description: string
  source: string
  installUrl?: string | null
  upstreamUrl: string
  publishedAt?: string | null
  modifiedAt?: string | null
}) {
  const homepage = new URL('/', canonical).toString()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${canonical}#software`,
        name,
        description,
        url: canonical,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Cross-platform',
        isAccessibleForFree: true,
        author: { '@type': 'Organization', name: source },
        ...(installUrl ? { codeRepository: installUrl } : {}),
        sameAs: [upstreamUrl, ...(installUrl ? [installUrl] : [])],
        ...(publishedAt ? { datePublished: publishedAt } : {}),
        ...(modifiedAt ? { dateModified: modifiedAt } : {})
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: homepage },
          {
            '@type': 'ListItem',
            position: 2,
            name: '热门 Skills',
            item: new URL('/skills', homepage).toString()
          },
          { '@type': 'ListItem', position: 3, name, item: canonical }
        ]
      }
    ]
  }
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
