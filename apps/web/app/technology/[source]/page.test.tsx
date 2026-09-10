import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getTechnologySource } from '../../../lib/technology-sources'
import Layout from '../layout'
import TechnologySourcePage, { TechnologySourceView } from './page'

vi.mock('next/navigation', () => ({
  usePathname: () => '/technology/hacker-news',
  notFound: vi.fn(),
  permanentRedirect: (path: string) => {
    throw new Error(`redirect:${path}`)
  }
}))

describe('TechnologySourceView', () => {
  it('renders a technology article source with breadcrumb context', () => {
    const feed: FeedResult = {
      state: 'ready',
      items: Array.from({ length: 7 }, (_, index) => ({
        sourceKey: `item-${index + 1}`,
        title: `热点 ${index + 1}`,
        url: `https://example.com/article/${index + 1}`,
        summary: null,
        author: null,
        publishedAt: null,
        position: index + 1
      })),
      status: {
        itemCount: 7,
        lastSuccessAt: new Date('2026-09-04T01:00:00.000Z')
      }
    }

    const html = renderToStaticMarkup(
      <Layout>
        <TechnologySourceView feed={feed} source={getTechnologySource('hacker-news')} />
      </Layout>
    )

    expect(html).toContain('首页')
    expect(html).toContain('科技')
    expect(html).toContain('Hacker News')
    expect(html).toContain('内容来源')
    expect(html).toContain('aria-current="page"')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(7)
    expect(html).not.toContain('href="https://example.com/article/')
    expect(html).not.toContain('每六小时')
    expect(html).not.toContain('更新于')
  })

  it('permanently redirects the legacy GitHub source route', async () => {
    await expect(
      TechnologySourcePage({ params: Promise.resolve({ source: 'github' }) })
    ).rejects.toThrow('redirect:/github')
  })
})
