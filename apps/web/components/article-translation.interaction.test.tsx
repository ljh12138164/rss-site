// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { ArticleTranslation } from './article-translation'

it('marks original and translated text across all reading modes without changing UI language', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({
        translation: {
          title: '中文标题',
          contentHtml: '<p>这是中文正文。</p>',
          summary: '中文摘要'
        }
      })
    )
  )
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () =>
      root.render(
        <ArticleTranslation
          articleId="one"
          source="openai"
          title="English article title"
          contentHtml="<p>This is an English article body for reading.</p>"
          summary={null}
          canTranslate
          sourceLabel={<span>来源</span>}
          metadata={<span>日期</span>}
        />
      )
    )
    expect(container.querySelector('h1')?.lang).toBe('en')
    expect(container.querySelector('.article-content')?.getAttribute('lang')).toBe('en')
    const press = async (label: string) => {
      const button = Array.from(container.querySelectorAll('button')).find(
        (node) => node.textContent === label
      )
      expect(button).toBeTruthy()
      await act(async () => button?.click())
    }
    await press('翻译为中文')
    expect(
      Array.from(container.querySelectorAll('.article-content'), (node) =>
        node.getAttribute('lang')
      )
    ).toEqual(['en', 'zh-CN'])
    expect(container.querySelector('header > p')?.getAttribute('lang')).toBe('zh-CN')
    expect(container.querySelector('fieldset')?.hasAttribute('lang')).toBe(false)
    await press('仅译文')
    expect(container.querySelector('h1')?.lang).toBe('zh-CN')
    expect(container.querySelector('.article-content')?.getAttribute('lang')).toBe('zh-CN')
    await press('仅原文')
    expect(container.querySelector('h1')?.lang).toBe('en')
    expect(container.querySelector('.article-content')?.getAttribute('lang')).toBe('en')
    await act(async () =>
      root.render(
        <ArticleTranslation
          articleId="two"
          source="openai"
          title="SQLite"
          contentHtml="<p>这是一篇中文正文。</p>"
          summary={null}
          canTranslate={false}
          sourceLabel={<span>来源</span>}
          metadata={<span>日期</span>}
        />
      )
    )
    expect(container.querySelector('h1')?.lang).toBe('en')
    expect(container.querySelector('.article-content')?.getAttribute('lang')).toBe('zh-CN')
  } finally {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  }
})
