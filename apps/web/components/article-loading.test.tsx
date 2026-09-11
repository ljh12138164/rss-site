import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import Ai from '../app/ai/[source]/[slug]/loading'
import Event from '../app/ai/events/[slug]/loading'
import Events from '../app/ai/events/loading'
import AiSection from '../app/ai/loading'
import Finance from '../app/finance/[source]/[slug]/loading'
import FinanceSection from '../app/finance/loading'
import Games from '../app/games/[source]/[slug]/loading'
import GamesSection from '../app/games/loading'
import News from '../app/news/[source]/[slug]/loading'
import NewsSection from '../app/news/loading'
import Social from '../app/social/[source]/[slug]/loading'
import SocialSection from '../app/social/loading'
import Technology from '../app/technology/[source]/[slug]/loading'
import TechnologySection from '../app/technology/loading'

vi.mock('./site-header', () => ({ SiteHeader: () => <header>今日热点</header> }))

describe('standalone route loading boundaries', () => {
  it.each([AiSection, FinanceSection, GamesSection, NewsSection, SocialSection, TechnologySection])(
    'keeps the site header outside section skeletons',
    (Loading) => {
      const html = renderToStaticMarkup(<Loading />)
      expect(html.match(/今日热点/g)).toHaveLength(1)
      expect(html.match(/<main/g)).toHaveLength(1)
      expect(html).toContain('<footer')
      expect(html).toContain('role="status"')
    }
  )

  it.each([Ai, Event, Finance, Games, News, Social, Technology])(
    'keeps one site shell and a bounded article placeholder',
    (Loading) => {
      const html = renderToStaticMarkup(<Loading />)
      expect(html.match(/今日热点/g)).toHaveLength(1)
      expect(html.match(/<main/g)).toHaveLength(1)
      expect(html).toContain('<footer')
      expect(html).toContain('max-w-[46rem]')
      expect(html).toContain('aria-busy="true"')
      expect(html).toContain('正在加载文章')
    }
  )

  it('keeps the timeline title and shell while events load', () => {
    const html = renderToStaticMarkup(<Events />)
    expect(html.match(/今日热点/g)).toHaveLength(1)
    expect(html.match(/<main/g)).toHaveLength(1)
    expect(html).toContain('AI 时间轴')
    expect(html).toContain('role="status"')
  })
})
