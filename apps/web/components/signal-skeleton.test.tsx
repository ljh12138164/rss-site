import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SectionLoading } from './section-loading'
import { SignalSkeleton } from './signal-skeleton'

describe('loading skeletons', () => {
  it('uses a visible skeleton surface without fading the whole block', () => {
    const html = renderToStaticMarkup(<SignalSkeleton className="h-4" />)

    expect(html).toContain('bg-skeleton')
    expect(html).toContain('skeleton-shimmer')
    expect(html).not.toContain('animate-pulse')
  })

  it('only replaces article content while the shared layout keeps navigation visible', () => {
    const html = renderToStaticMarkup(<SectionLoading />)

    expect(html).toContain('aria-label="正在加载文章"')
    expect(html).not.toContain('data-skeleton-region="sources"')
    expect(html).not.toContain('<header')
    expect(html).not.toContain('<nav')
    expect(html).not.toContain('grid-cols-[12rem_minmax(0,1fr)]')
  })
})
