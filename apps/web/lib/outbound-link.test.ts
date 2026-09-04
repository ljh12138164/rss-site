import { describe, expect, it } from 'vitest'
import { resolveOutboundDestination } from './outbound-link'

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
