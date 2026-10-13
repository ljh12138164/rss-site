import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { ArticleSummary } from './article-summary'

it('offers manual summarization without fetching on page render', () => {
  const fetcher = vi.spyOn(globalThis, 'fetch')
  try {
    const html = renderToStaticMarkup(
      <ArticleSummary articleId="one" source="openai" cacheKey="one:content-v1" />
    )
    expect(html).toContain('AI 总结')
    expect(html).not.toContain('正在生成')
    expect(fetcher).not.toHaveBeenCalled()
  } finally {
    fetcher.mockRestore()
  }
})
