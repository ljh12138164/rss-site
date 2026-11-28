import { describe, expect, it } from 'vitest'
import { bilibiliPlayerUrl, hasBilibiliDescription } from './bilibili-video'

describe('Bilibili video pages', () => {
  it('builds the official player URL and preserves the requested part', () => {
    expect(bilibiliPlayerUrl('https://www.bilibili.com/video/BV1G91WzWEH8/?p=3&autoplay=0')).toBe(
      'https://player.bilibili.com/player.html?bvid=BV1G91WzWEH8&p=3&autoplay=1&danmaku=0'
    )
    expect(bilibiliPlayerUrl('https://m.bilibili.com/video/av123?p=invalid')).toBe(
      'https://player.bilibili.com/player.html?aid=123&autoplay=1&danmaku=0'
    )
  })

  it.each([
    'https://www.bilibili.com.example.org/video/BV1G91WzWEH8',
    'https://www.bilibili.com@evil.example/video/BV1G91WzWEH8',
    'https://user@www.bilibili.com/video/BV1G91WzWEH8',
    'https://www.bilibili.com:8443/video/BV1G91WzWEH8',
    'https://www.bilibili.com/bangumi/play/ep123',
    'javascript:alert(1)'
  ])('does not embed unsupported links: %s', (url) => {
    expect(bilibiliPlayerUrl(url)).toBeNull()
  })

  it('hides empty and dash-only descriptions while keeping short text', () => {
    expect(hasBilibiliDescription(null)).toBe(false)
    expect(hasBilibiliDescription('   ')).toBe(false)
    expect(hasBilibiliDescription('  -  ')).toBe(false)
    expect(hasBilibiliDescription('新视频')).toBe(true)
  })
})
