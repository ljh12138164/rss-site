import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseSignalFeed } from './feed'
import { fetchStcnFeed } from './stcn'

afterEach(() => vi.unstubAllGlobals())

describe('STCN server ingestion', () => {
  it('recovers from one transient upstream timeout', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
      .mockResolvedValueOnce(
        new Response(
          '<ul class="infinite-list"><li><div class="tt"><a href="/article/detail/123.html">新闻</a></div></li></ul>'
        )
      )
      .mockResolvedValueOnce(
        new Response(
          '<div class="detail-title">新闻标题</div><div class="detail-content"><p>完整正文</p></div>'
        )
      )
    vi.stubGlobal('fetch', fetcher)
    expect(parseSignalFeed(await fetchStcnFeed(), '证券时报')).toHaveLength(1)
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(fetcher.mock.calls[0][0]).toBe(fetcher.mock.calls[1][0])
  })

  it('stops after two attempts when upstream timeouts persist', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    vi.stubGlobal('fetch', fetcher)
    await expect(fetchStcnFeed()).rejects.toThrow('The operation timed out.')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('retries a timed out article without re-fetching its list', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          '<ul class="infinite-list"><li><div class="tt"><a href="/article/detail/123.html">新闻</a></div></li></ul>'
        )
      )
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
      .mockResolvedValueOnce(
        new Response(
          '<div class="detail-title">新闻标题</div><div class="detail-content"><p>完整正文</p></div>'
        )
      )
    vi.stubGlobal('fetch', fetcher)
    expect(parseSignalFeed(await fetchStcnFeed(), '证券时报')).toHaveLength(1)
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(fetcher.mock.calls[1][0]).toBe(fetcher.mock.calls[2][0])
  })

  it('preserves the canonical URL, full content and Shanghai publication time', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(
        async (url: string) =>
          new Response(
            url.endsWith('/yw.html')
              ? '<ul class="infinite-list"><li><div class="tt"><a href="/article/detail/123.html">新闻</a><a href="https://evil.test/article/detail/1.html">外部</a></div></li></ul>'
              : '<div class="detail-title">新闻标题</div><div class="detail-info"><span>2026-11-06 08:26</span><span>作者：记者</span></div><div class="detail-content"><p>完整正文</p><img src="/cover.jpg"></div>'
          )
      )
    vi.stubGlobal('fetch', fetcher)
    const items = parseSignalFeed(await fetchStcnFeed(), '证券时报')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: '新闻标题',
      url: 'https://www.stcn.com/article/detail/123.html',
      author: '记者'
    })
    expect(items[0].publishedAt?.toISOString()).toBe('2026-11-06T00:26:00.000Z')
    expect(items[0].contentHtml).toContain('完整正文')
    expect(items[0].imageUrl).toBe('https://www.stcn.com/cover.jpg')
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://www.stcn.com/article/list/yw.html',
      'https://www.stcn.com/article/detail/123.html'
    ])
  })

  it('does not publish a successful feed when full content is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(
          async (url: string) =>
            new Response(
              url.endsWith('/yw.html')
                ? '<ul class="infinite-list"><li><div class="tt"><a href="/article/detail/123.html">新闻</a></div></li></ul>'
                : '<html>layout changed</html>'
            )
        )
    )
    await expect(fetchStcnFeed()).rejects.toThrow('STCN article content is missing')
  })
})
