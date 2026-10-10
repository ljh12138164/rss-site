import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CoverImage } from './cover-image'

describe('CoverImage', () => {
  it('offers an accessible preview button for a real cover', () => {
    const html = renderToStaticMarkup(
      <CoverImage src="https://example.com/cover.jpg" previewLabel="文章封面" />
    )
    expect(html).toContain('<button')
    expect(html).toContain('aria-label="预览图片：文章封面"')
    expect(html).not.toContain('<a ')
  })
  it('allows a platform icon to replace the default image when no cover is provided', () => {
    const html = renderToStaticMarkup(
      <CoverImage fallback={<span>平台图标</span>} previewLabel="平台占位" />
    )
    expect(html).toContain('平台图标')
    expect(html).not.toContain('/article-cover-default.svg')
    expect(html).not.toContain('<button')
  })
  it('shows the local default image with native lazy loading when a cover is absent', () => {
    const html = renderToStaticMarkup(<CoverImage />)
    expect(html).toContain('src="/article-cover-default.svg"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('alt=""')
  })

  it('accepts a cover and allows callers to configure fallback, size, alt text and eager loading', () => {
    const html = renderToStaticMarkup(
      <CoverImage
        src="https://example.com/cover.jpg"
        fallbackSrc="/custom-default.svg"
        alt="文章配图"
        width={240}
        height={150}
        loading="eager"
        className="w-24"
      />
    )
    expect(html).toContain('src="https://example.com/cover.jpg"')
    expect(html).toContain('alt="文章配图"')
    expect(html).toContain('width="240"')
    expect(html).toContain('height="150"')
    expect(html).toContain('loading="eager"')
    expect(html).toContain('w-24')
    const missing = renderToStaticMarkup(
      <CoverImage src={null} fallbackSrc="/custom-default.svg" />
    )
    expect(missing).toContain('src="/custom-default.svg"')
  })
})
