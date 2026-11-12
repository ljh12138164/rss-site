import { describe, expect, it } from 'vitest'
import { getSignalSource, resolveSignalFeedUrl, resolveSignalFeedUrls } from './index.js'

describe('@rss-site/signals', () => {
  it('resolves feed urls correctly', () => {
    const rsshubSource = getSignalSource('hacker-news')
    expect(resolveSignalFeedUrl(rsshubSource, 'https://rsshub.app')).toBe(
      'https://rsshub.app/hackernews'
    )

    const directSource = getSignalSource('github-blog')
    expect(resolveSignalFeedUrl(directSource, 'https://rsshub.app')).toBe(
      'https://github.blog/feed/'
    )
    expect(resolveSignalFeedUrl(getSignalSource('antigravity'), 'https://rsshub.app')).toBe(
      'https://rsshub.app/google/antigravity/blog/zh-CN'
    )
    expect(
      resolveSignalFeedUrl(getSignalSource('cloudflare-blog'), 'https://rss.ljhboard.cn')
    ).toBe('https://rss.ljhboard.cn/cloudflare/blog')
  })

  it('groups only Chinese NVIDIA and AMD feeds under two technology platforms', () => {
    expect(resolveSignalFeedUrls(getSignalSource('nvidia'), 'https://rss.ljhboard.cn')).toEqual([
      'https://rss.ljhboard.cn/nvidia/developer/zh-CN?limit=20',
      'https://blogs.nvidia.cn/feed/'
    ])
    expect(resolveSignalFeedUrls(getSignalSource('amd'), 'https://rss.ljhboard.cn')).toEqual([
      'https://rss.ljhboard.cn/amd/newsroom/all/zh-CN?limit=20'
    ])
    expect(
      resolveSignalFeedUrls(getSignalSource('github-blog'), 'https://rss.ljhboard.cn')
    ).toEqual(['https://github.blog/feed/'])
  })
})
