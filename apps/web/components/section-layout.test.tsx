import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import AiLayout from '../app/ai/layout'
import FinanceLayout from '../app/finance/layout'
import GamesLayout from '../app/games/layout'
import NewsLayout from '../app/news/layout'
import SocialLayout from '../app/social/layout'
import TechnologyLayout from '../app/technology/layout'
import { PaginatedArticleFeed } from './paginated-article-feed'
import { SectionLoading } from './section-loading'

const route = vi.hoisted(() => ({ pathname: '/ai' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('../lib/home-articles', () => ({
  getHomeArticles: () => new Promise(() => undefined)
}))

describe('section route layouts', () => {
  it('keeps one site shell when a source feed suspends', () => {
    route.pathname = '/technology/juejin'
    const html = renderToStaticMarkup(
      <TechnologyLayout>
        <PaginatedArticleFeed section="/technology" source="juejin" />
      </TechnologyLayout>
    )
    expect(html.match(/今日热点/g)).toHaveLength(1)
    expect(html.match(/<main /g)).toHaveLength(1)
    expect(html.match(/aria-label="内容来源"/g)).toHaveLength(1)
    expect(html).toContain('aria-label="正在加载文章"')
  })

  it.each([
    ['/ai/openai', 'OpenAI', AiLayout],
    ['/technology/hacker-news', 'Hacker News', TechnologyLayout],
    ['/news/xinhua', '新华社', NewsLayout],
    ['/social/bilibili', '哔哩哔哩综合热门', SocialLayout],
    ['/finance/wallstreetcn', '华尔街见闻', FinanceLayout],
    ['/games/steam', 'Steam 热销榜', GamesLayout]
  ] as const)('keeps the selected source visible while %s loads', (pathname, title, Layout) => {
    route.pathname = pathname
    const html = renderToStaticMarkup(
      <Layout>
        <SectionLoading />
      </Layout>
    )
    expect(html.match(/<main /g)).toHaveLength(1)
    expect(html.match(/aria-label="内容来源"/g)).toHaveLength(1)
    expect(html).toContain(title)
    expect(html).toMatch(new RegExp(`aria-current="page"[^>]+href="${pathname}"`))
    expect(html.indexOf('aria-label="内容来源"')).toBeLessThan(
      html.indexOf('aria-label="正在加载文章"')
    )
    expect(html).not.toContain('data-skeleton-region="sources"')
  })

  it('leaves news article details in their own reading layout', () => {
    route.pathname = '/news/xinhua/article-id'
    const html = renderToStaticMarkup(
      <NewsLayout>
        <main>文章详情</main>
      </NewsLayout>
    )
    expect(html).toBe('<main>文章详情</main>')
  })
})
