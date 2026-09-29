import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { isExternalLink, OutboundDialog, OutboundDialogView } from './outbound-dialog'

describe('OutboundDialog', () => {
  it('does not render an open dialog by default', () => {
    const html = renderToStaticMarkup(<OutboundDialog />)
    expect(html).not.toContain('即将离开本站')
    expect(html).not.toContain('继续访问')
  })

  it('renders confirmation dialog with direct destination link when outbound URL is set', () => {
    const targetUrl = 'https://example.com/tech/news-item'
    const pending = `/out?url=${encodeURIComponent(targetUrl)}&from=%2F`
    const html = renderToStaticMarkup(
      <OutboundDialogView destination={targetUrl} pending={pending} onClose={() => {}} />
    )

    // Heading for accessibility
    expect(html).toContain('即将离开本站')
    expect(html).toContain('slot="title"')
    expect(html).toContain('你将访问第三方网站的原文，请注意信息安全。')

    // Shows decoded destination
    expect(html).toContain(targetUrl)

    // Action buttons
    expect(html).toContain('取消')
    expect(html).toContain('继续访问')

    // Crucial: "继续访问" must link directly to the target external URL, NOT re-routed through /out?
    expect(html).toContain(`href="${targetUrl}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer noopener external"')
    expect(html).not.toContain('href="/out?')
  })

  it('safely handles missing destination fallback without rendering unsafe hrefs', () => {
    const html = renderToStaticMarkup(
      <OutboundDialogView destination={null} pending="/" onClose={() => {}} />
    )

    expect(html).toContain('即将离开本站')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('href="/"')
  })

  it('renders confirmation dialog when pending is a direct external URL', () => {
    const directUrl = 'https://github.com/trending'
    const html = renderToStaticMarkup(
      <OutboundDialogView destination={directUrl} pending={directUrl} onClose={() => {}} />
    )

    expect(html).toContain('即将离开本站')
    expect(html).toContain(directUrl)
    expect(html).toContain(`href="${directUrl}"`)
    expect(html).toContain('target="_blank"')
  })
})

describe('isExternalLink', () => {
  it('identifies /out? URLs as external', () => {
    const el = { hasAttribute: () => false }
    expect(isExternalLink(el, '/out?url=https%3A%2F%2Fexample.com')).toBe(true)
  })

  it('identifies data-outbound anchors as external', () => {
    const el = { hasAttribute: (attr: string) => attr === 'data-outbound' }
    expect(isExternalLink(el, 'https://example.com/article')).toBe(true)
  })

  it('identifies cross-origin absolute URLs as external', () => {
    const el = { hasAttribute: () => false }
    expect(isExternalLink(el, 'https://external-domain.com/path', 'https://news.ljhboard.cn')).toBe(
      true
    )
  })

  it('does not treat same-origin absolute URLs as external unless data-outbound is present', () => {
    const el = { hasAttribute: () => false }
    expect(isExternalLink(el, 'https://news.ljhboard.cn/finance', 'https://news.ljhboard.cn')).toBe(
      false
    )
  })

  it('does not treat relative URLs without data-outbound as external', () => {
    const el = { hasAttribute: () => false }
    expect(isExternalLink(el, '/technology/hacker-news', 'https://news.ljhboard.cn')).toBe(false)
    expect(isExternalLink(el, '/', 'https://news.ljhboard.cn')).toBe(false)
  })
})
