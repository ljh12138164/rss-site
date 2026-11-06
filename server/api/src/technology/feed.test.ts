import { describe, expect, it } from 'vitest'
import { parseTechnologyFeed } from './feed.js'

describe('parseTechnologyFeed', () => {
  it('reads RSSHub creators while keeping an explicit RSS author first', () => {
    const xml = `<rss xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
      <item><title>Creator</title><link>https://example.com/creator</link><dc:creator>Matthias Bastian</dc:creator></item>
      <item><title>Author</title><link>https://example.com/author</link><author>RSS Author</author><dc:creator>Feed Creator</dc:creator></item>
      <item><title>Empty author</title><link>https://example.com/empty</link><author></author><dc:creator>Feed Creator</dc:creator></item>
    </channel></rss>`
    expect(parseTechnologyFeed(xml, 'test').map((item) => item.author)).toEqual([
      'Matthias Bastian',
      'RSS Author',
      'Feed Creator'
    ])
  })

  it('prefers an image enclosure over an inline illustration and skips audio enclosures', () => {
    const xml = `<rss><channel><item>
      <title>Article</title><link>https://example.com/article</link>
      <description><![CDATA[<img src="https://example.com/chart.png">]]></description>
      <enclosure url="https://example.com/audio.mp3" type="audio/mpeg" />
      <enclosure url="/cover.webp" type="image/webp" />
    </item></channel></rss>`
    expect(parseTechnologyFeed(xml, 'test')[0]?.imageUrl).toBe('https://example.com/cover.webp')
  })

  it('skips unsafe enclosure and inline image URLs before choosing a valid content image', () => {
    const xml = `<rss><channel><item>
      <title>Article</title><link>https://example.com/article</link>
      <description><![CDATA[<img src="data:image/png;base64,placeholder"><img src="/cover.png">]]></description>
      <enclosure url="javascript:alert(1)" type="image/png" />
    </item></channel></rss>`
    expect(parseTechnologyFeed(xml, 'test')[0]?.imageUrl).toBe('https://example.com/cover.png')
  })
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

  it('keeps skill metrics when a long description reaches the summary limit', () => {
    const xml = `<rss><channel><item><title>#1 example-skill</title><link>https://www.skills.sh/example/repo/example-skill</link><description><![CDATA[
      <p>${'Long description. '.repeat(50)}</p>
      <p><strong>Rank:</strong> 1</p>
      <p><strong>Installs:</strong> 1,234</p>
      <p><strong>Source:</strong> example/repo</p>
      <p><strong>Source type:</strong> github</p>
      <p><strong>Hourly change:</strong> +42</p>
      <p><strong>Same hour yesterday:</strong> 1,192</p>
    ]]></description></item></channel></rss>`

    const item = parseTechnologyFeed(xml, 'skills.sh', { skillMetadata: true })[0]
    expect(item?.summary).toHaveLength(500)
    expect(item?.summary).toContain(' · Installs: 1,234')
    expect(item?.summary).toContain(' · Source: example/repo')
    expect(item?.summary).toContain(' · Hourly change: +42')
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

  it('preserves fragment identifiers in sourceKey when guid differentiates items by hash', () => {
    const xml = `
      <rss><channel>
        <item>
          <title>Release 1</title>
          <link>https://help.openai.com/en/articles/6825453-chatgpt-release-notes</link>
          <guid>https://help.openai.com/en/articles/6825453-chatgpt-release-notes#1789344000000</guid>
        </item>
        <item>
          <title>Release 2</title>
          <link>https://help.openai.com/en/articles/6825453-chatgpt-release-notes</link>
          <guid>https://help.openai.com/en/articles/6825453-chatgpt-release-notes#1788998400000</guid>
        </item>
      </channel></rss>`

    const items = parseTechnologyFeed(xml, 'ChatGPT')
    expect(items).toHaveLength(2)
    expect(items[0].sourceKey).toBe(
      'https://help.openai.com/en/articles/6825453-chatgpt-release-notes#1789344000000'
    )
    expect(items[1].sourceKey).toBe(
      'https://help.openai.com/en/articles/6825453-chatgpt-release-notes#1788998400000'
    )
    expect(items[0].sourceKey).not.toBe(items[1].sourceKey)
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

  it('uses the linked GLM model page instead of repeated release-page links', () => {
    const xml = `
      <rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
        <item>
          <title>2025-12-11</title>
          <link>https://docs.bigmodel.cn/cn/update/new-releases#2025-12-11</link>
          <guid isPermaLink="false">release-1</guid>
          <content:encoded><![CDATA[
            <p><a href="/cn/guide/models/vlm/autoglm-phone"><strong>AutoGLM-Phone</strong></a></p>
          ]]></content:encoded>
        </item>
        <item>
          <title>2025-12-11</title>
          <link>https://docs.bigmodel.cn/cn/update/new-releases#2025-12-11</link>
          <guid isPermaLink="false">release-2</guid>
          <content:encoded><![CDATA[
            <p><a href="/cn/guide/models/sound-and-video/glm-tts"><strong>GLM-TTS</strong></a></p>
          ]]></content:encoded>
        </item>
      </channel></rss>`

    const items = parseTechnologyFeed(xml, '智谱 GLM', { urlFromFirstAnchor: true })
    expect(items.map(({ sourceKey, url }) => ({ sourceKey, url }))).toEqual([
      {
        sourceKey: 'release-1',
        url: 'https://docs.bigmodel.cn/cn/guide/models/vlm/autoglm-phone'
      },
      {
        sourceKey: 'release-2',
        url: 'https://docs.bigmodel.cn/cn/guide/models/sound-and-video/glm-tts'
      }
    ])
  })

  it('parses Atom 1.0 feeds with full-text summary and alternate links', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Tech Blog</title>
        <entry>
          <title>LLM Systems Architecture</title>
          <link href="https://example.com/blog/llm-arch" rel="alternate"/>
          <id>tag:example.com,2026:llm-arch</id>
          <published>2026-09-22T23:46:41Z</published>
          <author><name>Alice Engineer</name></author>
          <summary type="html"><![CDATA[<p>Deep dive into modern LLM inference systems.</p>]]></summary>
        </entry>
      </feed>`

    const [item] = parseTechnologyFeed(xml, 'Tech Blog')
    expect(item).toMatchObject({
      sourceKey: 'tag:example.com,2026:llm-arch',
      title: 'LLM Systems Architecture',
      url: 'https://example.com/blog/llm-arch',
      author: 'Alice Engineer',
      summary: 'Deep dive into modern LLM inference systems.',
      contentHtml: '<p>Deep dive into modern LLM inference systems.</p>',
      publishedAt: new Date('2026-09-22T23:46:41Z'),
      position: 1
    })
  })
})
