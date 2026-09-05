import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MediaPreview } from './media-preview'

describe('MediaPreview', () => {
  it('keeps the fallback visible while a real image lazily loads', () => {
    const html = renderToStaticMarkup(
      <MediaPreview imageUrl="https://i2.hdslb.com/bfs/archive/cover.jpg" />
    )

    expect(html).toContain('data-state="loading"')
    expect(html).toContain('MEDIA SIGNAL')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
    expect(html).toContain('referrerPolicy="no-referrer"')
    expect(html).toContain('src="https://i2.hdslb.com/bfs/archive/cover.jpg"')
  })

  it('renders only the shared fallback when no image is available', () => {
    const html = renderToStaticMarkup(<MediaPreview />)

    expect(html).toContain('data-state="fallback"')
    expect(html).toContain('MEDIA SIGNAL')
    expect(html).not.toContain('<img')
  })
})
