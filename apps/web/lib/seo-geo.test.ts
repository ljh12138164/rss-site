import { listSignalSources } from '@rss-site/signals'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET as getLlmsTxt } from '../app/llms.txt/route'
import { GET as getLlmsFullTxt } from '../app/llms-full.txt/route'
import manifest from '../app/manifest'
import { formatDailyBriefingText } from './daily-share'
import { buildLeaderboardFaqItems, type ModelLeaderboardItem } from './leaderboard'
import {
  createDailyReportStructuredData,
  createHomepageStructuredData,
  createLeaderboardStructuredData,
  createModelDetailStructuredData,
  createSkillStructuredData
} from './seo'

afterEach(() => {
  vi.unstubAllEnvs()
})

const sampleModel: ModelLeaderboardItem = {
  slug: 'claude-opus-5-5',
  name: 'Claude Opus 5.5',
  creator: 'Anthropic',
  overallScore: '78.3',
  rank: 1,
  releasedAt: '2026-11-20',
  scores: {},
  tags: [],
  url: '/leaderboard/claude-opus-5-5'
}

describe('SEO/GEO structured data, llms.txt, manifest, and daily share formatting', () => {
  it('omits hidden FAQPage on homepage and includes OpenPick in sameAs', () => {
    const data = createHomepageStructuredData('https://news.ljhboard.cn/', '2026-11-28T08:00:00Z')
    const types = data['@graph'].map((node) => node['@type'])
    expect(types).not.toContain('FAQPage')
    const org = data['@graph'].find((node) => node['@type'] === 'Organization')
    expect(org?.sameAs).toContain('https://software.ljhboard.cn/')
    const webpage = data['@graph'].find((node) => node['@type'] === 'WebPage')
    expect(webpage?.dateModified).toBe('2026-11-28T08:00:00Z')
  })

  it('builds synchronized leaderboard FAQ, Dataset, model detail, daily, and skill JSON-LD', () => {
    const faqs = buildLeaderboardFaqItems(
      { overall: [sampleModel], coding: [sampleModel] },
      '2026-11-28'
    )
    expect(faqs.length).toBeGreaterThanOrEqual(3)
    expect(faqs[0].answer).toContain('Claude Opus 5.5')

    const lb = createLeaderboardStructuredData({
      canonical: 'https://news.ljhboard.cn/leaderboard',
      updatedAt: '2026-11-28T08:00:00Z',
      models: [sampleModel],
      faqItems: faqs
    })
    expect(lb['@graph'].map((node) => node['@type'])).toEqual([
      'Dataset',
      'ItemList',
      'BreadcrumbList',
      'FAQPage'
    ])

    const model = createModelDetailStructuredData({
      canonical: 'https://news.ljhboard.cn/leaderboard/claude-opus-5-5',
      name: 'Claude Opus 5.5',
      creator: 'Anthropic',
      description: '评测明细',
      modifiedAt: '2026-11-28T08:00:00Z'
    })
    expect(model['@graph'].map((node) => node['@type'])).toEqual(['TechArticle', 'BreadcrumbList'])

    const daily = createDailyReportStructuredData({
      canonical: 'https://news.ljhboard.cn/daily/2026-11-28',
      reportDate: '2026-11-28',
      title: '今日要闻',
      description: '概览',
      publishedAt: '2026-11-28T00:05:00Z',
      citations: ['https://example.com/a']
    })
    expect(daily['@graph'].map((node) => node['@type'])).toEqual(['Article', 'BreadcrumbList'])

    const skill = createSkillStructuredData({
      canonical: 'https://news.ljhboard.cn/skills/owner/repo/skill',
      name: 'seo-audit',
      description: 'SEO audit skill',
      source: 'owner/repo',
      installUrl: 'https://github.com/owner/repo',
      upstreamUrl: 'https://skills.sh/owner/repo/skill'
    })
    expect(skill['@graph'].map((node) => node['@type'])).toEqual([
      'SoftwareApplication',
      'BreadcrumbList'
    ])
  })

  it('dynamically renders llms.txt and llms-full.txt with current signal count and core hubs', async () => {
    vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
    const totalSources = listSignalSources().length

    const llms = await (await getLlmsTxt()).text()
    expect(llms).toContain(`${totalSources} 路`)
    expect(llms).toContain('https://news.ljhboard.cn/daily')
    expect(llms).toContain('https://news.ljhboard.cn/leaderboard')
    expect(llms).toContain('https://news.ljhboard.cn/skills')
    expect(llms).toContain('https://news.ljhboard.cn/github')
    expect(llms).toContain('https://news.ljhboard.cn/feeds/daily.xml')

    const full = await (await getLlmsFullTxt()).text()
    expect(full).toContain(`共 ${totalSources} 路`)
    expect(full).toContain('https://news.ljhboard.cn/leaderboard')
    expect(full).toContain('https://news.ljhboard.cn/feeds/daily.xml')
  })

  it('generates a valid PWA manifest and formatted daily briefing share text', () => {
    const pwa = manifest()
    expect(pwa.start_url).toBe('/')
    expect(pwa.display).toBe('standalone')
    expect(pwa.icons?.length).toBeGreaterThanOrEqual(1)

    const text = formatDailyBriefingText(
      {
        reportDate: '2026-11-28',
        title: 'AI 新进展',
        windowStart: '2026-11-27T00:00:00Z',
        windowEnd: '2026-11-28T00:00:00Z',
        publishedAt: '2026-11-28T00:05:00Z',
        storyCount: 1,
        sourceCount: 1,
        sources: [],
        content: {
          headlineId: 's1',
          overview: { text: '今天发生了一件大事。', sourceIds: [] },
          stories: [
            {
              id: 's1',
              section: 'ai',
              title: 'AI 新进展',
              summary: '详细摘要内容。',
              sourceIds: []
            }
          ]
        }
      },
      'https://news.ljhboard.cn'
    )
    expect(text).toContain('【今日热点 · 2026-11-28 日报】')
    expect(text).toContain('01. AI 新进展')
    expect(text).toContain('https://news.ljhboard.cn/daily/2026-11-28')
  })
})
