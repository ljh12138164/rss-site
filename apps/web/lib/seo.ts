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
  'https://tools.ljhboard.cn/',
  'https://token.ljhboard.cn/'
] as const
export const HOMEPAGE_PUBLISHED_AT = '2026-09-01T00:00:00+08:00'
export const HOMEPAGE_MODIFIED_AT = '2026-10-23T00:00:00+08:00'
export const HOMEPAGE_CITATIONS = [
  'https://www.rssboard.org/rss-specification',
  'https://www.rfc-editor.org/rfc/rfc4287',
  'https://modelcontextprotocol.io/specification',
  'https://llmstxt.org/'
] as const

export const HOMEPAGE_FAQ_ITEMS = [
  {
    question: '今日热点（AI 热榜）是什么，收录了哪些平台的内容？',
    answer:
      "今日热点是一个免注册的多平台公开内容聚合站，覆盖 AI 、科技、国内新闻、社交、财经与游戏 6 个阅读分区及 2 个 Skills 排行榜，共接入 43 路固定信源。其中 AI 分区收录 OpenAI 、 ChatGPT 、 Anthropic 、 DeepSeek 、智谱 GLM 、 Google AI 、 Antigravity 、 Qwen 、 Lil'Log 与 Simon Willison 共 10 路官方博客与技术专栏；科技分区包含 GitHub Trending 、 Hacker News 、 GitHub Blog 、 Cloudflare Blog 、掘金、 IT之家、 36氪 与极客公园共 8 路来源。"
  },
  {
    question: '各分区的内容每隔多久同步一次，时间和正文怎么处理？',
    answer:
      '系统采用定时错峰拉取机制，不是实时流式抓取。 AI 分区的 8 路核心模型动态每 2 小时检查 1 次更新，单源每次保留最近 20 条记录；科技、国内新闻、社交热点、财经、游戏分区及 2 路 AI Agent Skills 榜单每 6 小时同步 1 次，单源每次保留 20 至 100 条记录。所有条目保留上游原始 URL 与发布时间，不篡改标题观点，也不伪造缺失的发布时间戳。'
  },
  {
    question: '如何用 RSS 阅读器或 AI 客户端（MCP / llms.txt）接入本站？',
    answer:
      '站点同时提供标准 RSS 2.0 订阅源与面向大模型的结构化接口。普通读者可直接把 /feeds/ai.xml 、 /feeds/technology.xml 、 /feeds/news.xml 、 /feeds/social.xml 、 /feeds/finance.xml 和 /feeds/games.xml 共 6 路地址添加到 NetNewsWire 、 Folo 或 Reeder 等阅读器；开发者与 AI Agent 可通过 /mcp 接入 Model Context Protocol 工具（单次最多查询 100 条热点），或直接读取 /llms.txt 与 /llms-full.txt 获取站点信源目录。'
  },
  {
    question: '浏览和收藏需要注册账号吗，个人阅读记录保存在哪里？',
    answer:
      '浏览全文、搜索关键词、查看 AI 时间轴和切换双语译文均无需注册或登录。你设置的关注来源（/following）、书签收藏与最近 100 条浏览足迹（/reading-list）直接保存在当前浏览器的 localStorage 与 IndexedDB 本地存储中；满 200 个非空白字符的文章支持生成中文总结，服务端与本地缓存有效期为 7 至 30 天。'
  }
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

export function createHomepageStructuredData(canonical: string) {
  const homepage = new URL('/', canonical).toString()
  const organizationId = `${homepage}#organization`
  const authorId = `${homepage}#author`
  const websiteId = `${homepage}#website`
  const webpageId = `${homepage}#webpage`

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
        dateModified: HOMEPAGE_MODIFIED_AT,
        citation: [...HOMEPAGE_CITATIONS],
        inLanguage: 'zh-CN'
      },
      {
        '@type': 'FAQPage',
        '@id': `${homepage}#faq`,
        url: `${homepage}#faq`,
        isPartOf: { '@id': webpageId },
        author: { '@id': authorId },
        publisher: { '@id': organizationId },
        datePublished: HOMEPAGE_PUBLISHED_AT,
        dateModified: HOMEPAGE_MODIFIED_AT,
        inLanguage: 'zh-CN',
        mainEntity: HOMEPAGE_FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
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
