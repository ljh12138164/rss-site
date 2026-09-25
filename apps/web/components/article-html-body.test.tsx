import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ArticleHtmlBody } from './article-html-body'

// Mock CctvVideoPlayer to isolate the mounting behavior
vi.mock('./cctv-video-player', () => ({
  CctvVideoPlayer: ({ pid, type }: { pid: string; type?: string }) => (
    <div data-testid="mock-cctv-player" data-pid={pid} data-type={type}>
      CCTV Player Mock {pid}
    </div>
  )
}))

describe('ArticleHtmlBody', () => {
  it('renders standard sanitized HTML without modifying content if no video mount exists', () => {
    const html = renderToStaticMarkup(<ArticleHtmlBody html="<p>第一段内容</p><p>第二段内容</p>" />)
    expect(html).toContain('第一段内容')
    expect(html).toContain('第二段内容')
    expect(html).not.toContain('mock-cctv-player')
  })

  it('interleaves text blocks and mounts CctvVideoPlayer where data-cctv-video is located', () => {
    const inputHtml =
      '<p>导语文字</p><div data-cctv-video="fdec9a65d6a34784bec390395b9431f2" data-cctv-type="0" class="cctv-video-mount"></div><p>正文内容</p>'

    const html = renderToStaticMarkup(<ArticleHtmlBody html={inputHtml} />)

    expect(html).toContain('导语文字')
    expect(html).toContain('正文内容')
    expect(html).toContain('data-testid="mock-cctv-player"')
    expect(html).toContain('data-pid="fdec9a65d6a34784bec390395b9431f2"')
    expect(html).toContain('data-type="0"')
  })
})
