import { describe, expect, it } from 'vitest'
import { parseTechnologyFeed } from './feed.js'

describe('parseTechnologyFeed', () => {
  it('falls back to a bounded summary for oversized content', () => {
    const xml = `<rss><channel><item><title>文章</title><link>https://example.com/a</link><description><![CDATA[<p>${'中'.repeat(180000)}</p>]]></description></item></channel></rss>`
    const item = parseTechnologyFeed(xml, 'test')[0]
    expect(item.contentHtml).toBeNull()
    expect(item.summary).toHaveLength(500)
  })
  it('keeps encoded HTML independently from its short list summary', () => {
    const body = `<h2>标题</h2><p>${'正文'.repeat(400)}</p>`
    const xml = `<rss><channel><item><title>文章</title><link>https://example.com/a</link><description>摘要</description><content:encoded><![CDATA[${body}]]></content:encoded></item></channel></rss>`
    const item = parseTechnologyFeed(xml, 'test')[0]
    expect(item.contentHtml).toBe(body)
    expect(item.summary).toBe('摘要')
  })
  it('preserves RSS order and accepts external article hosts', () => {
    const xml = `
      <rss><channel>
        <item>
          <title>First &amp; useful</title>
          <link>https://example.com/story?utm_source=rsshub#comments</link>
          <guid>story-1</guid>
          <description><![CDATA[<p>A <strong>plain</strong> summary.</p>]]></description>
          <author>Ada</author>
          <pubDate>Thu, 03 Sep 2026 08:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Second</title>
          <link>http://news.example.org/article</link>
        </item>
      </channel></rss>`

    expect(parseTechnologyFeed(xml, 'Hacker News')).toEqual([
      {
        sourceKey: 'story-1',
        title: 'First & useful',
        url: 'https://example.com/story',
        imageUrl: null,
        summary: 'A plain summary.',
        contentHtml: '<p>A <strong>plain</strong> summary.</p>',
        author: 'Ada',
        publishedAt: new Date('2026-09-03T08:00:00.000Z'),
        position: 1
      },
      {
        sourceKey: 'http://news.example.org/article',
        title: 'Second',
        url: 'http://news.example.org/article',
        imageUrl: null,
        summary: null,
        contentHtml: null,
        author: null,
        publishedAt: null,
        position: 2
      }
    ])
  })

  it.each([
    ['malformed XML', '<rss><channel>'],
    ['an empty feed', '<rss><channel><title>empty</title></channel></rss>'],
    [
      'an item without a title',
      '<rss><channel><item><link>https://example.com/1</link></item></channel></rss>'
    ],
    [
      'an item without a web link',
      '<rss><channel><item><title>missing link</title><link>javascript:alert(1)</link></item></channel></rss>'
    ]
  ])('rejects %s so existing rankings cannot be cleared', (_case, xml) => {
    expect(() => parseTechnologyFeed(xml, 'Test source')).toThrow()
  })

  it('skips malformed entries when the feed still contains a usable article', () => {
    const xml = `
      <rss><channel>
        <item>
          <title>没有可访问原文的快讯</title>
          <link />
          <guid>broken-item</guid>
        </item>
        <item>
          <title>可访问的财经文章</title>
          <link>https://example.com/finance/story</link>
          <guid>usable-item</guid>
        </item>
      </channel></rss>`

    expect(parseTechnologyFeed(xml, '金十数据')).toEqual([
      {
        sourceKey: 'usable-item',
        title: '可访问的财经文章',
        url: 'https://example.com/finance/story',
        imageUrl: null,
        summary: null,
        contentHtml: null,
        author: null,
        publishedAt: null,
        position: 1
      }
    ])
  })

  it('uses the first strong content label for explicitly configured GLM feeds', () => {
    const xml = `
      <rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item>
        <title>2026-09-04</title>
        <link>https://docs.bigmodel.cn/cn/update/new-releases/glm-5</link>
        <guid>glm-5</guid>
        <content:encoded><![CDATA[<p><strong>GLM-5.3-Flash</strong> 正式发布</p>]]></content:encoded>
      </item></channel></rss>`

    expect(parseTechnologyFeed(xml, '智谱 GLM', { titleFromFirstStrong: true })[0]).toMatchObject({
      title: 'GLM-5.3-Flash',
      summary: 'GLM-5.3-Flash 正式发布'
    })
  })

  it('falls back to the original title when a configured feed has no strong label', () => {
    const xml = `
      <rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item>
        <title>GLM 更新</title>
        <link>https://docs.bigmodel.cn/cn/update/new-releases/glm</link>
        <content:encoded><![CDATA[<p>更新说明</p>]]></content:encoded>
      </item></channel></rss>`

    expect(parseTechnologyFeed(xml, '智谱 GLM', { titleFromFirstStrong: true })[0]?.title).toBe(
      'GLM 更新'
    )
  })

  it('extracts the first valid image without confusing an iframe for a preview', () => {
    const xml = `
      <rss><channel><item>
        <title>B 站热门视频</title>
        <link>https://www.bilibili.com/video/BV123</link>
        <description><![CDATA[
          <p>
            <iframe src="https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV123"></iframe>
            <img src="https://i2.hdslb.com/bfs/archive/cover.jpg?utm_source=rsshub" alt="封面">
          </p>
        ]]></description>
      </item></channel></rss>`

    expect(parseTechnologyFeed(xml, '哔哩哔哩')[0]).toMatchObject({
      url: 'https://www.bilibili.com/video/BV123',
      imageUrl: 'https://i2.hdslb.com/bfs/archive/cover.jpg'
    })
  })

  it('rejects unsafe image protocols without rejecting the feed item', () => {
    const xml = `
      <rss><channel><item>
        <title>安全条目</title>
        <link>https://example.com/story</link>
        <description><![CDATA[<img src="javascript:alert(1)">正文]]></description>
      </item></channel></rss>`

    expect(parseTechnologyFeed(xml, '测试来源')[0]?.imageUrl).toBeNull()
  })
})
