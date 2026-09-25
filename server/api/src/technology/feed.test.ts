import { describe, expect, it } from 'vitest'
import { parseTechnologyFeed } from './feed.js'

describe('parseTechnologyFeed', () => {
  it('cleans OpenAI audio UI from both stored HTML and summary', () => {
    const xml =
      '<rss><channel><item><title>Example</title><link>https://openai.com/index/example</link><description><![CDATA[<div data-read-aloud-ui="true"><div>Loading…</div><audio></audio></div><p>Actual article.</p>]]></description></item></channel></rss>'
    const [item] = parseTechnologyFeed(xml, 'OpenAI')
    expect(item.contentHtml).toBe('<p>Actual article.</p>')
    expect(item.summary).toBe('Actual article.')
  })
  it('cleans CCTV CMS template tags and video codes from both stored HTML and summary', () => {
    const xml =
      '<rss><channel><item><title>CCTV News</title><link>https://news.cctv.com/article</link><description><![CDATA[<p>[!--begin:htmlVideoCode--]fdec9a65d6a34784bec390395b9431f2,0,1,16:9,newPlayer[!--end:htmlVideoCode--]央视快讯：秋粮喜获丰收。</p>]]></description></item></channel></rss>'
    const [item] = parseTechnologyFeed(xml, 'CCTV')
    expect(item.contentHtml).toBe('<p>央视快讯：秋粮喜获丰收。</p>')
    expect(item.summary).toBe('央视快讯：秋粮喜获丰收。')
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

  it('decodes HTML entities that remain in parsed feed titles', () => {
    const xml = `
      <rss><channel><item>
        <title>Don&amp;#39;t ship R&amp;amp;D regressions</title>
        <link>https://example.com/release</link>
      </item></channel></rss>`

    expect(parseTechnologyFeed(xml, 'GitHub Blog')[0]?.title).toBe("Don't ship R&D regressions")
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
