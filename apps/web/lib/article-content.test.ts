import { describe, expect, it } from 'vitest'
import { renderArticleContent } from './article-content'

describe('article HTML', () => {
  it('removes the OpenAI read-aloud placeholder while keeping article text', () => {
    const html =
      '<div data-read-aloud-ui="true"><div><span>Loading…</span></div><audio preload="none"></audio></div><p>Loading models is useful.</p>'
    expect(renderArticleContent(html, 'https://openai.com/index/example', 'ai')).toBe(
      '<p>Loading models is useful.</p>'
    )
    expect(renderArticleContent(html, 'https://example.com/article', 'ai')).toContain('Loading…')
  })
  it('removes CCTV CMS template tags and video player codes', () => {
    const html =
      '<p>[!--begin:htmlVideoCode--]fdec9a65d6a34784bec390395b9431f2,0,1,16:9,newPlayer[!--end:htmlVideoCode--]央视快讯：秋粮喜获丰收。</p>'
    expect(
      renderArticleContent(html, 'https://news.cctv.com/2026/09/25/ARTIfdec9a65d6a3.shtml', 'news')
    ).toBe('<p>央视快讯：秋粮喜获丰收。</p>')
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
  it('resolves relative source links and preserves the outbound notice', () => {
    const html = render(
      '<a href="../two?q=1&amp;x=2" target="_top" ping="https://tracker.test">read</a>'
    )
    expect(html).toContain(
      '/out?url=https%3A%2F%2Fexample.com%2Ftwo%3Fq%3D1%26x%3D2&amp;from=%2Fai'
    )
    expect(html).not.toContain('target=')
    expect(html).not.toContain('ping=')
    expect(render(html)).toBe(html)
  })
  it('rejects an oversized body rather than rendering a truncated HTML fragment', () => {
    expect(render('中'.repeat(180000))).toBe('')
  })
})
