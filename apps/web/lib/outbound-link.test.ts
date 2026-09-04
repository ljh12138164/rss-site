import { describe, expect, it } from 'vitest'
import { resolveOutboundDestination, resolveOutboundReturnPath } from './outbound-link'

describe('resolveOutboundDestination', () => {
  it('allows normal web links without restricting the destination host', () => {
    expect(resolveOutboundDestination('https://example.com/article')).toBe(
      'https://example.com/article'
    )
    expect(resolveOutboundDestination('http://legacy.example.com/article')).toBe(
      'http://legacy.example.com/article'
    )
  })

  it.each(['javascript:alert(1)', 'data:text/html,hello', 'not a URL'])(
    'blocks the unsafe destination %s',
    (url) => {
      expect(resolveOutboundDestination(url)).toBeNull()
    }
  )
})

describe('resolveOutboundReturnPath', () => {
  it('allows only known section paths', () => {
    expect(resolveOutboundReturnPath('/news')).toBe('/news')
    expect(resolveOutboundReturnPath('/ai')).toBe('/ai')
    expect(resolveOutboundReturnPath('/technology')).toBe('/technology')
    expect(resolveOutboundReturnPath('https://evil.example')).toBe('/technology')
  })
})
