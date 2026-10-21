import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import HomePage from './page'

vi.mock('../components/theme-toggle', () => ({ ThemeToggle: () => null }))

it('provides the approved homepage, reading entry and six section destinations', () => {
  const html = renderToStaticMarkup(<HomePage />)
  expect(html).toContain('今天的热点，在这里看')
  expect(html).toContain('href="/latest"')
  for (const section of ['ai', 'technology', 'news', 'social', 'finance', 'games']) {
    expect(html).toContain(`href="/${section}"`)
  }
  expect(html).toContain('href="/github"')
  expect(html).toContain('href="/ai/openai"')
  expect(html).toContain('href="/social/zhihu"')
  expect(html).toContain('href="/about#rss"')
  expect(html).toContain('已配置来源数')
  expect(html).toContain('不代表实时热度或文章数量')
  expect(html).not.toContain('今日速览')
})
