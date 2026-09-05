import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OutboundView } from './page'

describe('OutboundView', () => {
  it('offers only a verified destination and the third-party boundary notice', () => {
    const html = renderToStaticMarkup(<OutboundView destination="https://juejin.cn/post/123" />)

    expect(html).toContain('即将离开本站')
    expect(html).toContain('本站仅作信息聚合与索引，不代表本站立场')
    expect(html).toContain('juejin.cn')
    expect(html).toContain('href="https://juejin.cn/post/123"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer noopener external"')
    expect(html).toContain('返回热点列表')
    expect(html).toContain('href="/technology"')
    expect(html).not.toContain('构建可靠的前端应用')
    expect(html).not.toContain('从边界状态和数据流开始设计。')
    expect(html).not.toContain('示例作者')
  })

  it('does not render an outbound action when the URL is blocked', () => {
    const html = renderToStaticMarkup(<OutboundView destination={null} />)

    expect(html).toContain('链接已停止放行')
    expect(html).not.toContain('继续访问原文')
  })

  it('returns news readers to the news section', () => {
    const html = renderToStaticMarkup(
      <OutboundView destination="https://www.news.cn/story" returnTo="/news" />
    )

    expect(html).toContain('href="/news"')
  })

  it('returns social readers to the social section', () => {
    const html = renderToStaticMarkup(
      <OutboundView destination="https://www.bilibili.com/video/BV123" returnTo="/social" />
    )

    expect(html).toContain('href="/social"')
  })

  it('returns finance readers to the finance section', () => {
    const html = renderToStaticMarkup(
      <OutboundView destination="https://wallstreetcn.com/articles/1" returnTo="/finance" />
    )

    expect(html).toContain('href="/finance"')
  })
})
