import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OutboundView } from './page'

describe('OutboundView', () => {
  it('shows only the compact departure notice, full destination, and continue action', () => {
    const html = renderToStaticMarkup(<OutboundView destination="https://juejin.cn/post/123" />)

    expect(html).toContain('AI 热榜')
    expect(html).toContain('即将离开 AI 热榜，请注意账号财产安全')
    expect(html).toContain('https://juejin.cn/post/123')
    expect(html).toContain('href="https://juejin.cn/post/123"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer noopener external"')
    expect(html).toContain('继续访问')
    expect(html).not.toContain('本站仅作信息聚合与索引')
    expect(html).not.toContain('目标站点')
    expect(html).not.toContain('返回热点列表')
    expect(html.match(/<a /g)).toHaveLength(1)
  })

  it('does not render an outbound action when the URL is blocked', () => {
    const html = renderToStaticMarkup(<OutboundView destination={null} />)

    expect(html).toContain('链接已停止放行')
    expect(html).not.toContain('继续访问原文')
  })

  it('keeps the return path for a blocked destination', () => {
    const html = renderToStaticMarkup(<OutboundView destination={null} returnTo="/news" />)

    expect(html).toContain('href="/news"')
  })
})
