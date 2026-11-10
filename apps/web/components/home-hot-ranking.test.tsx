import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { HotRanking } from '../../../shared/hot-ranking'
import { HomeHotRanking } from './home-hot-ranking'

it('shows heat, source counts and stale state with internal citations, then falls back to original URLs', () => {
  const ranking: HotRanking = {
    state: 'ready',
    delayed: true,
    computedAt: '2026-11-09T08:00:00Z',
    articleCount: 40,
    entries: [
      {
        eventId: '00000000-0000-4000-8000-000000000001',
        title: '可独立阅读的热点标题',
        summary: '交代主体、动作和目前的限制。',
        heat: 25.5,
        participants: 7,
        imageUrl: null,
        references: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            source: 'ithome',
            section: 'technology',
            title: '原始报道标题',
            url: 'https://example.com/news'
          }
        ]
      }
    ]
  }
  const render = () => renderToStaticMarkup(<HomeHotRanking ranking={ranking} />)
  expect(render()).toContain('25.5')
  expect(render()).toContain('7')
  expect(render()).toContain('更新延迟')
  expect(render()).toContain('/technology/ithome/')
  expect(render()).not.toContain('今日速览')
  ranking.entries[0].references[0].available = false
  expect(render()).toContain('href="https://example.com/news"')
  expect(renderToStaticMarkup(<HomeHotRanking ranking={{ state: 'unavailable' }} />)).toContain(
    '热点排行暂不可用'
  )
  ranking.entries = []
  expect(render()).toContain('暂未发现符合条件')
  expect(render()).not.toContain('暂不可用')
})
