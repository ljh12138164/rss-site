import { describe, expect, it } from 'vitest'
import { parseTechnologyFeed } from './feed.js'

describe('parseTechnologyFeed', () => {
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
        summary: 'A plain summary.',
        author: 'Ada',
        publishedAt: new Date('2026-09-03T08:00:00.000Z'),
        position: 1
      },
      {
        sourceKey: 'http://news.example.org/article',
        title: 'Second',
        url: 'http://news.example.org/article',
        summary: null,
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
})
