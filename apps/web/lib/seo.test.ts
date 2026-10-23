import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  articleDescription,
  createArticleStructuredData,
  createEventStructuredData,
  createHomepageStructuredData,
  createPageMetadata,
  serializeStructuredData,
  toMetaDescription
} from './seo'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('createPageMetadata', () => {
  it('keeps canonical and social metadata aligned for the requested page', () => {
    vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')

    expect(
      createPageMetadata({
        title: '国内新闻',
        description: '来自权威媒体的国内新闻与热点。',
        path: '/news'
      })
    ).toMatchObject({
      title: '国内新闻',
      description: '来自权威媒体的国内新闻与热点。',
      alternates: { canonical: 'https://news.ljhboard.cn/news' },
      openGraph: {
        type: 'website',
        title: '国内新闻',
        description: '来自权威媒体的国内新闻与热点。',
        url: 'https://news.ljhboard.cn/news',
        siteName: '今日热点',
        locale: 'zh_CN'
      },
      twitter: {
        card: 'summary',
        title: '国内新闻',
        description: '来自权威媒体的国内新闻与热点。'
      }
    })
  })
})

describe('toMetaDescription', () => {
  it('falls back to visible body when the summary is empty', () => {
    expect(articleDescription('  ', '<p>模型已正式发布。</p><p>可以下载。</p>')).toBe(
      '模型已正式发布。 可以下载。'
    )
    expect(articleDescription('真实摘要', '<p>正文</p>')).toBe('真实摘要')
  })
  it('ends long descriptions at a complete sentence when one fits the limit', () => {
    const text =
      '第一句说明这条动态的核心事实，并提供足够上下文。第二句继续补充背景信息，但不应在元描述中被截断到一半。第三句不会进入结果。'

    expect(toMetaDescription(text, 42)).toBe('第一句说明这条动态的核心事实，并提供足够上下文。')
  })
})

describe('structured data', () => {
  it('describes the product homepage with organization, author, dates, citations, sameAs, and FAQPage schema', () => {
    const data = createHomepageStructuredData('https://news.ljhboard.cn/')
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@graph']).toEqual([
      expect.objectContaining({
        '@type': 'Organization',
        '@id': 'https://news.ljhboard.cn/#organization',
        name: '今日热点',
        alternateName: 'AI 热榜',
        url: 'https://news.ljhboard.cn/',
        sameAs: expect.arrayContaining(['https://github.com/ljh12138164/rss-site'])
      }),
      expect.objectContaining({
        '@type': 'Person',
        '@id': 'https://news.ljhboard.cn/#author',
        name: 'LJH',
        url: 'https://blog.ljhboard.cn/',
        sameAs: expect.arrayContaining(['https://github.com/ljh12138164'])
      }),
      expect.objectContaining({
        '@type': 'WebSite',
        '@id': 'https://news.ljhboard.cn/#website',
        url: 'https://news.ljhboard.cn/',
        name: '今日热点',
        alternateName: 'AI 热榜',
        inLanguage: 'zh-CN',
        sameAs: expect.arrayContaining(['https://github.com/ljh12138164/rss-site'])
      }),
      expect.objectContaining({
        '@type': 'WebPage',
        '@id': 'https://news.ljhboard.cn/#webpage',
        url: 'https://news.ljhboard.cn/',
        name: '今日热点',
        description: '每日聚合 AI、科技、新闻、社交、财经与游戏热点。',
        isPartOf: { '@id': 'https://news.ljhboard.cn/#website' },
        author: { '@id': 'https://news.ljhboard.cn/#author' },
        publisher: { '@id': 'https://news.ljhboard.cn/#organization' },
        datePublished: '2026-09-01T00:00:00+08:00',
        dateModified: '2026-10-23T00:00:00+08:00',
        citation: expect.arrayContaining(['https://www.rssboard.org/rss-specification']),
        inLanguage: 'zh-CN'
      }),
      expect.objectContaining({
        '@type': 'FAQPage',
        '@id': 'https://news.ljhboard.cn/#faq',
        author: { '@id': 'https://news.ljhboard.cn/#author' },
        datePublished: '2026-09-01T00:00:00+08:00',
        dateModified: '2026-10-23T00:00:00+08:00',
        mainEntity: expect.arrayContaining([
          expect.objectContaining({
            '@type': 'Question',
            name: expect.stringContaining('今日热点'),
            acceptedAnswer: expect.objectContaining({
              '@type': 'Answer',
              text: expect.stringContaining('OpenAI')
            })
          })
        ])
      })
    ])
  })

  it('links an article to its original source and visible breadcrumb trail', () => {
    const graph = createArticleStructuredData({
      type: 'NewsArticle',
      canonical: 'https://news.ljhboard.cn/news/xinhua/example--id',
      title: '测试新闻',
      description: '测试摘要',
      sourceUrl: 'https://example.com/original',
      sourceName: '新华社',
      sectionName: '国内新闻',
      sectionPath: '/news',
      sourcePath: '/news/xinhua',
      publishedAt: '2026-09-19T01:00:00.000Z',
      modifiedAt: '2026-09-20T02:00:00.000Z',
      author: '测试作者',
      language: 'zh-CN'
    })

    expect(graph['@graph'][0]).toMatchObject({
      '@type': 'NewsArticle',
      headline: '测试新闻',
      url: 'https://news.ljhboard.cn/news/xinhua/example--id',
      datePublished: '2026-09-19T01:00:00.000Z',
      dateModified: '2026-09-20T02:00:00.000Z',
      isBasedOn: 'https://example.com/original',
      provider: { '@type': 'Organization', name: '新华社' },
      author: { '@type': 'Person', name: '测试作者' }
    })
    expect(graph['@graph'][1]).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: '首页', item: 'https://news.ljhboard.cn/' },
        { position: 2, name: '国内新闻', item: 'https://news.ljhboard.cn/news' },
        { position: 3, name: '新华社', item: 'https://news.ljhboard.cn/news/xinhua' },
        {
          position: 4,
          name: '测试新闻',
          item: 'https://news.ljhboard.cn/news/xinhua/example--id'
        }
      ]
    })
  })

  it('escapes markup delimiters before embedding JSON-LD in HTML', () => {
    expect(serializeStructuredData({ value: '</script>' })).toContain('\\u003c/script>')
  })

  it('describes an AI event and its citations without inventing a publisher', () => {
    const graph = createEventStructuredData({
      canonical: 'https://news.ljhboard.cn/ai/events/model-release',
      title: '模型发布',
      description: '模型发布事件摘要。',
      publishedAt: '2026-09-19T01:00:00Z',
      modifiedAt: '2026-09-20T02:00:00Z',
      language: 'zh-CN',
      citations: ['https://example.com/source']
    })

    expect(graph['@graph'][0]).toMatchObject({
      '@type': 'Article',
      url: 'https://news.ljhboard.cn/ai/events/model-release',
      inLanguage: 'zh-CN',
      about: { '@type': 'Thing', name: '人工智能' },
      citation: ['https://example.com/source']
    })
    expect(graph['@graph'][1]).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: '首页' },
        { position: 2, name: 'AI 时间轴' },
        { position: 3, name: '模型发布' }
      ]
    })
  })
})
