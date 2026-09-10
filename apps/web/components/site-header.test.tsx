import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { SiteHeader } from './site-header'

vi.mock('next/navigation', () => ({ usePathname: () => '/github' }))
vi.mock('./article-search', () => ({ ArticleSearch: () => null }))
vi.mock('./theme-toggle', () => ({ ThemeToggle: () => null }))

it('places the open source ranking after the AI timeline with one active section', () => {
  const html = renderToStaticMarkup(<SiteHeader />)
  const timeline = html.indexOf('href="/ai/events"')
  const ranking = html.indexOf('href="/github"')

  expect(timeline).toBeGreaterThan(-1)
  expect(ranking).toBeGreaterThan(timeline)
  expect(html).toMatch(/aria-current="page"[^>]+href="\/github"/)
  expect(html).not.toMatch(/aria-current="page"[^>]+href="\/technology"/)
})
