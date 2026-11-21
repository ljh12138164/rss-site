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
})
