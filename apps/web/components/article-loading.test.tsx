import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import Ai from '../app/ai/[source]/[slug]/loading'
import Events from '../app/ai/events/(timeline)/loading'
import Event from '../app/ai/events/[slug]/loading'
import Finance from '../app/finance/[source]/[slug]/loading'
import Games from '../app/games/[source]/[slug]/loading'
import News from '../app/news/[source]/[slug]/loading'
import Social from '../app/social/[source]/[slug]/loading'
import Technology from '../app/technology/[source]/[slug]/loading'

vi.mock('./site-header', () => ({ SiteHeader: () => <header>今日热点</header> }))

describe('standalone route loading boundaries', () => {
  it('never exposes a timeline fallback above an event detail route', async () => {
    const boundaries = import.meta.glob('../app/**/loading.tsx')
    const detail = '../app/ai/events/[slug]/page.tsx'
    for (const [path, boundary] of Object.entries(boundaries)) {
      if (!detail.startsWith(path.replace(/loading\.tsx$/, ''))) continue
      const { default: Loading } = (await boundary()) as { default: typeof Event }
      expect(renderToStaticMarkup(<Loading />)).not.toContain('正在加载时间轴')
    }
  })

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
