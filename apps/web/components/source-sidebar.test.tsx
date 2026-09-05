import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { aiSources } from '../lib/technology-sources'
import { SourceSidebar } from './source-sidebar'

describe('SourceSidebar', () => {
  it('uses full platform names and marks the selected source', () => {
    const html = renderToStaticMarkup(
      <SourceSidebar active="anthropic" ariaLabel="AI平台" basePath="/ai" sources={aiSources} />
    )

    expect(html).toContain('aria-label="AI平台"')
    expect(html).toContain('href="/ai/anthropic"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('Google AI / Gemini')
    expect(html).not.toContain('>AN<')
    expect(html).not.toContain('2H')
  })
})
