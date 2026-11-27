import { describe, expect, it } from 'vitest'
import { parseSignalFeed } from './feed.js'

describe('parseSignalFeed AWS cleaning', () => {
  it('strips AWS author footer chrome before extracting fallback cover images', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Artificial Intelligence</title>
    <item>
      <title>Use Kimi Code CLI with models on Amazon Bedrock</title>
      <link>https://aws.amazon.com/blogs/machine-learning/use-kimi-code-cli-with-models-on-amazon-bedrock/</link>
      <dc:creator>Alex Thewsey</dc:creator>
      <pubDate>Thu, 19 Nov 2026 23:00:00 GMT</pubDate>
      <enclosure url="https://d2908q01vomqb2.cloudfront.net/avatar.jpg" type="image/jpeg" />
      <description><![CDATA[Short excerpt.]]></description>
      <content:encoded><![CDATA[<p>Body paragraph without images.</p><hr /><h2><strong>About the authors</strong></h2><footer><div class="blog-author-box"><div class="blog-author-image"><img src="https://d2908q01vomqb2.cloudfront.net/avatar.jpg" alt="Alex Thewsey" /></div><h3>Alex Thewsey</h3><p>Author bio.</p></div></footer>]]></content:encoded>
    </item>
  </channel>
</rss>`

    const [item] = parseSignalFeed(xml, 'AWS Machine Learning Blog')
    expect(item?.contentHtml).toBe('<p>Body paragraph without images.</p>')
    expect(item?.imageUrl).toBeNull()
  })

  it('prefers image enclosures and preserves merged co-authors', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>AWS Security Blog</title>
    <item>
      <title>Scope down permissions</title>
      <link>https://aws.amazon.com/blogs/security/scope-down-permissions/</link>
      <dc:creator>Vaishnavi Merugu, Ryan Peng</dc:creator>
      <pubDate>Fri, 20 Nov 2026 00:00:00 GMT</pubDate>
      <enclosure url="https://d2908q01vomqb2.cloudfront.net/featured.jpeg" type="image/jpeg" />
      <description><![CDATA[<p>Security guidance body.</p>]]></description>
    </item>
  </channel>
</rss>`

    const [item] = parseSignalFeed(xml, 'AWS Security Blog')
    expect(item?.imageUrl).toBe('https://d2908q01vomqb2.cloudfront.net/featured.jpeg')
    expect(item?.author).toBe('Vaishnavi Merugu, Ryan Peng')
    expect(item?.contentHtml).toBe('<p>Security guidance body.</p>')
  })

  it('drops KaTeX annotation nodes from extracted plain-text summaries', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Apple ML</title>
    <item>
      <title>Best-of-N alignment</title>
      <link>https://machinelearning.apple.com/research/example</link>
      <pubDate>Fri, 20 Nov 2026 00:00:00 GMT</pubDate>
      <description><![CDATA[<p>Best-of-<math><semantics><mrow><mi>N</mi></mrow><annotation encoding="application/x-tex">N</annotation></semantics></math> bound.</p>]]></description>
    </item>
  </channel>
</rss>`

    const [item] = parseSignalFeed(xml, 'Apple ML')
    expect(item?.summary).toBe('Best-of- N bound.')
  })
})

describe('parseSignalFeed OpenAI cleaning', () => {
  it('drops residual OpenAI Share action chrome and compacts oversized Shiki/Astro developer posts before the 512 KB gate', () => {
    const bloatedPre = `<astro-island props='{"expr":"a > b","pad":"${'x'.repeat(260000)}"}'><pre class="shiki" data-1p-ignore="true" data-language="python"><code>${'<span class="syntax-highlighter-line"><span class="shiki-token">x = 1</span></span>\n'.repeat(3000)}</code></pre></astro-island>`
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>OpenAI</title>
    <item>
      <title>See PR scans in action</title>
      <link>https://openai.com/business/learn/pr-scans-demo/</link>
      <pubDate>Thu, 19 Nov 2026 00:00:00 GMT</pubDate>
      <description><![CDATA[<div class="wrap"><div data-article-hero-actions="true"><div class="icon" /><button><svg><path d="M0 0"/></svg>Share</button></div></div>]]></description>
    </item>
    <item>
      <title>Time awareness and async input for personal agents</title>
      <link>https://developers.openai.com/blog/time-awareness-and-async-input-for-personal-agents</link>
      <pubDate>Fri, 20 Nov 2026 00:00:00 GMT</pubDate>
      <description><![CDATA[<p>Practical agent orchestration guide.</p>${bloatedPre}]]></description>
    </item>
  </channel>
</rss>`

    const [demoItem, blogItem] = parseSignalFeed(xml, 'OpenAI')
    expect(demoItem?.contentHtml).toBeNull()
    expect(demoItem?.summary).toBeNull()
    expect(blogItem?.contentHtml).not.toBeNull()
    expect(Buffer.byteLength(blogItem?.contentHtml ?? '', 'utf8')).toBeLessThan(100000)
    expect(blogItem?.contentHtml).toContain('<pre><code class="language-python">')
    expect(blogItem?.contentHtml).not.toContain('astro-island')
    expect(blogItem?.contentHtml).not.toContain('shiki-token')
    expect(blogItem?.contentHtml).not.toContain('"pad":')
  })
})
