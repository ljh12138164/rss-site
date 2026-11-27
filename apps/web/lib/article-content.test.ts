import { describe, expect, it } from 'vitest'
import { renderArticleContent } from './article-content'

describe('article HTML', () => {
  const openAiToc =
    '<ul><li><a href="#first">First section</a></li><li><a href="https://openai.com/index/example#second">Second section</a></li></ul>'
  const openAiBody = '<h2>First section</h2><p>Article text.</p><h2>Second section</h2>'

  it('removes duplicate OpenAI same-article TOCs while keeping the body', () => {
    expect(
      renderArticleContent(openAiToc + openAiToc + openAiBody, 'https://openai.com/index/example')
    ).toBe(openAiBody)
  })
  it('strips OpenAI Share action controls from demo shells and normal articles', () => {
    const shareAction =
      '<div class="@container"><div data-article-hero-actions="true"><div class="spacer" /><button type="button"><svg><path d="M0 0"/></svg>Share</button></div></div>'
    expect(
      renderArticleContent(
        `${shareAction}<p>Intro paragraph.</p>`,
        'https://openai.com/index/example'
      )
    ).toBe('<p>Intro paragraph.</p>')
    expect(
      renderArticleContent(shareAction, 'https://openai.com/business/learn/pr-scans-demo/')
    ).toBe('')
  })
  it('removes AWS blog author bio footer chrome while preserving article content', () => {
    const html =
      '<p>Main article body.</p><hr /><h2><strong>About the authors</strong></h2><footer><div class="blog-author-box"><div class="blog-author-image"><img src="https://d2908q01vomqb2.cloudfront.net/author.jpg" alt="Alex" /></div><h3 class="lb-h4">Alex</h3><p>Bio text.</p></div></footer>'
    expect(
      renderArticleContent(
        html,
        'https://aws.amazon.com/blogs/machine-learning/use-kimi-code-cli-with-models-on-amazon-bedrock/'
      )
    ).toBe('<p>Main article body.</p>')
  })
  it('removes orphaned trailing AWS author headings even without a footer box', () => {
    const html =
      '<p>Main article body.</p><p>&nbsp;</p><hr style="width: 100%"><h2>About the authors</h2>'
    expect(
      renderArticleContent(
        html,
        'https://aws.amazon.com/blogs/storage/how-ignyte-runs-candidate-search-with-amazon-s3-vectors/'
      )
    ).toBe('<p>Main article body.</p>')
  })
  it('converts CCTV video codes into playable mount divs while stripping other template tags', () => {
    const html =
      '<p>[!--begin:htmlVideoCode--]fdec9a65d6a34784bec390395b9431f2,0,1,16:9,newPlayer[!--end:htmlVideoCode--]</p><p>央视快讯：秋粮喜获丰收。[!--page--]</p>'
    expect(
      renderArticleContent(html, 'https://news.cctv.com/2026/09/25/ARTIfdec9a65d6a3.shtml', 'news')
    ).toBe(
      '<div data-cctv-video="fdec9a65d6a34784bec390395b9431f2" data-cctv-type="0" class="cctv-video-mount"></div><p>央视快讯：秋粮喜获丰收。</p>'
    )
  })
  const render = (html: string) => renderArticleContent(html, 'https://example.com/posts/one', 'ai')
  it('preserves readable blocks and normalizes headings', () => {
    const html = render(
      '<h1>标题</h1><p>正文 <strong>重点</strong></p><ul><li>事项</li></ul><pre><code>&lt;div&gt;</code></pre><table><tr><td>数据</td></tr></table>'
    )
    expect(html).toContain('<h2>标题</h2>')
    expect(html).toContain('<strong>重点</strong>')
    expect(html).toContain('<code>&lt;div&gt;</code>')
    expect(html).toContain('<td>数据</td>')
  })
  it('removes executable HTML, CSS, media and dangerous URLs', () => {
    const html = render(
      '<script>alert(1)</script><style>body{display:none}</style><p onclick="evil()" style="position:fixed">safe</p><img src=x onerror=evil()><iframe srcdoc="evil"></iframe><svg><script>evil()</script></svg><a href="java&#x73;cript:evil()">bad</a><form><input name=x></form>'
    )
    expect(html).toBe('<p>safe</p><span>bad</span>')
  })
  it('resolves relative source links and preserves outbound attributes', () => {
    const html = render(
      '<a href="../two?q=1&amp;x=2" target="_top" ping="https://tracker.test">read</a>'
    )
    expect(html).toContain('href="https://example.com/two?q=1&amp;x=2"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('data-outbound="true"')
    expect(html).not.toContain('ping=')
    expect(render(html)).toBe(html)
  })
  it('preserves MathML equations while stripping KaTeX duplicate markup and unsafe payloads', () => {
    const html = render(
      '<p>We use <span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>h</mi><mi>l</mi></msub></mrow><annotation encoding="application/x-tex">h_l</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base">h_l</span></span></span> in training.</p><span class="katex-display"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><mi>O</mi><mo stretchy="false">(</mo><mfrac><mn>1</mn><mi>ε</mi></mfrac><mo stretchy="false">)</mo></mrow><annotation encoding="application/x-tex">O(1/\\varepsilon)</annotation></semantics></math></span></span></span><math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)></table></mtext><script>alert(1)</script><mi href="javascript:alert(1)" onclick="evil()">z</mi></math>'
    )
    expect(html).toContain('<math><mrow><msub><mi>h</mi><mi>l</mi></msub></mrow></math>')
    expect(html).toContain(
      '<math display="block"><mrow><mi>O</mi><mo stretchy="false">(</mo><mfrac><mn>1</mn><mi>ε</mi></mfrac><mo stretchy="false">)</mo></mrow></math>'
    )
    expect(html).not.toContain('katex')
    expect(html).not.toContain('x-tex')
    expect(html).not.toContain('h_l')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('onclick')
    expect(html).not.toContain('javascript:')
  })
  it('rejects an oversized body rather than rendering a truncated HTML fragment', () => {
    expect(render('中'.repeat(180000))).toBe('')
  })
})
