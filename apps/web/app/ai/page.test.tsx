import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { groupAiTimelineItems } from '../../components/ai-timeline'
import type { AiTimelineResult } from '../../lib/hot-feed'
import { AiView } from './page'

const timeline: AiTimelineResult = {
  state: 'ready',
  items: [
    {
      source: 'openai',
      sourceKey: 'openai-latest',
      title: 'OpenAI 官方更新',
      url: 'https://openai.com/index/update',
      summary: null,
      author: null,
      publishedAt: new Date('2026-09-05T12:00:00.000Z'),
      position: 1
    },
    {
      source: 'anthropic',
      sourceKey: 'anthropic-previous',
      title: 'Anthropic 官方更新',
      url: 'https://www.anthropic.com/news/update',
      summary: null,
      author: null,
      publishedAt: new Date('2026-09-04T12:00:00.000Z'),
      position: 1
    }
  ]
}

describe('AiView', () => {
  it('groups dates by the Shanghai calendar day and preserves unknown dates', () => {
    const items = timeline.state === 'ready' ? timeline.items : []
    const groups = groupAiTimelineItems([
      ...items,
      { ...items[0], sourceKey: 'openai-midnight', publishedAt: new Date('2026-09-04T16:30:00Z') },
      { ...items[0], sourceKey: 'openai-undated', publishedAt: null }
    ])

    expect(groups.map((group) => group.key)).toEqual(['2026-09-05', '2026-09-04', 'unknown'])
    expect(groups[0].items).toHaveLength(2)
    expect(groups[2].label).toBe('日期未知')
  })

  it('renders a chronological timeline with source navigation and outbound links', () => {
    const html = renderToStaticMarkup(<AiView timeline={timeline} />)

    expect(html).toContain('AI 最近发生了什么')
    expect(html).toContain('AI 平台事件时间线')
    expect(html).toContain('09/05')
    expect(html.indexOf('OpenAI 官方更新')).toBeLessThan(html.indexOf('Anthropic 官方更新'))
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(2)
    expect(html).toContain('from=%2Fai')
    expect(html).toContain('href="/ai/openai"')
  })

  it('renders an honest empty state without placeholder events', () => {
    const html = renderToStaticMarkup(<AiView timeline={{ state: 'empty' }} />)

    expect(html).toContain('正在等待第一轮信号')
    expect(html).not.toContain('href="/out?url=')
  })

  it('renders the database read error state', () => {
    const html = renderToStaticMarkup(<AiView timeline={{ state: 'error' }} />)

    expect(html).toContain('暂时无法读取热点')
    expect(html).not.toContain('href="/out?url=')
  })
})
