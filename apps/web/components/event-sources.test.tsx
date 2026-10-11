import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { EventSources } from './event-sources'

it('shows actual publishers, deduplicates sources and keeps source links', () => {
  const html = renderToStaticMarkup(
    <EventSources sources={['openai', 'anthropic', 'openai', 'simon-willison']} />
  )
  expect(html).toContain('href="/ai/openai"')
  expect(html).toContain('href="/ai/anthropic"')
  expect(html).toContain('href="/ai/simon-willison"')
  expect(html.match(/href="\/ai\/openai"/g)).toHaveLength(1)
  expect(html).toContain('Simon Willison')
})

it('identifies missing and unknown publishers without guessing a platform', () => {
  expect(renderToStaticMarkup(<EventSources sources={[]} />)).toContain('来源暂缺')
  const html = renderToStaticMarkup(<EventSources sources={['unknown-platform']} />)
  expect(html).toContain('unknown-platform')
  expect(html).not.toContain('href=')
})
