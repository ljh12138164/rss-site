import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ModelDetail, ModelLeaderboardItem } from '../../lib/leaderboard'
import { ModelDetailView } from './model-detail-view'
import { ModelLeaderboard } from './model-leaderboard'

const mockItems: ModelLeaderboardItem[] = [
  {
    slug: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    creator: 'Google',
    overallScore: '75.2',
    rank: 1,
    releasedAt: '2026-10-28T00:00:00.000Z',
    coverage: { count: 17, percentage: 47 },
    scores: {
      编程: { score: '73.1', rank: '第2名' },
      科研: { score: '76.6', rank: '第1名' }
    },
    tags: ['综合榜', 'Google'],
    url: '/leaderboard/gemini-4-carbon'
  },
  {
    slug: 'gpt-6-terra',
    name: 'GPT-6.1 Terra',
    creator: 'OpenAI',
    overallScore: '68.2',
    rank: 2,
    releasedAt: '2026-10-26T00:00:00.000Z',
    pricing: {
      currency: 'CNY',
      input: '6.66',
      output: '33.31'
    },
    scores: {
      编程: { score: '67.8', rank: '第10名' }
    },
    tags: ['综合榜', 'OpenAI'],
    url: '/leaderboard/gpt-6-terra'
  }
]

const mockDetail: ModelDetail = {
  slug: 'gemini-4-carbon',
  name: 'Gemini 4 Carbon',
  creator: 'Google',
  overallScore: '75.2',
  rank: 1,
  releasedAt: '2026-10-28T00:00:00.000Z',
  coverage: { count: 17, percentage: 47 },
  scores: {
    编程: { score: '73.1', rank: '第2名' },
    科研: { score: '76.6', rank: '第1名' }
  },
  evidenceSections: [
    {
      domain: '编程',
      title: '编程领域评测成绩',
      score: '73.1',
      benchmarks: [
        {
          name: 'Terminal-Bench 4.0',
          evaluator: 'Vals AI',
          rawScore: '63.1%',
          capabilityScore: '76.5',
          config: 'High 推理',
          rank: '第 4 名',
          url: 'https://vals.ai/terminal-bench-4'
        }
      ]
    }
  ],
  unmeasuredBenchmarks: ['LiveBench · 编程综合', 'Code Migration']
}

describe('ModelLeaderboard component', () => {
  it('renders model leaderboard tabs, items, scores and navigation links', () => {
    const html = renderToStaticMarkup(
      <ModelLeaderboard categories={{ overall: mockItems, coding: [mockItems[0]] }} />
    )

    expect(html).toContain('综合')
    expect(html).toContain('代码与编程')
    expect(html).toContain('Gemini 4 Carbon')
    expect(html).toContain('Google')
    expect(html).toContain('75.2')
    expect(html).toContain('GPT-6.1 Terra')
    expect(html).toContain('OpenAI')
    expect(html).toContain('输入 ¥6.66 / 输出 ¥33.31')
    expect(html).toContain('href="/leaderboard/gemini-4-carbon"')
    expect(html).toContain('卡片')
    expect(html).toContain('列表')
  })
})

describe('ModelDetailView component', () => {
  it('renders model detail overview, sub-scores, evidence benchmarks, and unmeasured badges', () => {
    const html = renderToStaticMarkup(<ModelDetailView detail={mockDetail} />)

    expect(html).toContain('Gemini 4 Carbon')
    expect(html).toContain('Google')
    expect(html).toContain('75.2')
    expect(html).toContain('No.1')
    expect(html).toContain('Terminal-Bench 4.0')
    expect(html).toContain('Vals AI')
    expect(html).toContain('63.1%')
    expect(html).toContain('76.5')
    expect(html).toContain('High 推理')
    expect(html).toContain('LiveBench · 编程综合')
    expect(html).toContain('Code Migration')
    expect(html).toContain('能力折算分说明')
    expect(html).toContain('href="/leaderboard"')
  })
})
