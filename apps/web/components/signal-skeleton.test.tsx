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

  it('matches the horizontal source navigation instead of the removed sidebar', () => {
    const html = renderToStaticMarkup(<SectionLoading />)

    expect(html).toContain('data-skeleton-region="sources"')
    expect(html).not.toContain('grid-cols-[12rem_minmax(0,1fr)]')
  })
})
