import { runInNewContext } from 'node:vm'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { GoogleScripts } from './google-scripts'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('next/script', () => ({
  default: ({ children }: { children?: string }) => (children ? <script>{children}</script> : null)
}))

describe('Umami before-send filter', () => {
  const script = renderToStaticMarkup(<GoogleScripts />).match(/<script>([\s\S]+)<\/script>/)?.[1]

  function beforeSend(userAgent: string) {
    const window: { umamiBeforeSend?: (type: string, payload: { url: string }) => unknown } = {}
    runInNewContext(script ?? '', { navigator: { userAgent }, window })
    return window.umamiBeforeSend
  }

  it.each(['OAI-SearchBot/1.4', 'meta-externalagent/1.1', 'meta-webindexer/1.1', 'bingbot/2.0'])(
    'cancels tracking for %s even when the user agent resembles Chrome',
    (bot) => {
      const handler = beforeSend(`Mozilla/5.0 Chrome/145.0.0.0 (compatible; ${bot})`)
      expect(handler?.('event', { url: '/' })).toBe(false)
    }
  )

  it('accepts a browser pageview and still cancels outbound pageviews', () => {
    const handler = beforeSend('Mozilla/5.0 Chrome/145.0.0.0 Safari/537.36')
    const pageview = { url: '/daily' }
    expect(handler?.('event', pageview)).toBe(pageview)
    expect(handler?.('event', { url: '/out?url=example' })).toBe(false)
  })
})
