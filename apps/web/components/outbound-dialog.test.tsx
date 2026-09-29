import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OutboundDialog, OutboundDialogView } from './outbound-dialog'

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
})
