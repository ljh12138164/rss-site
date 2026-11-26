// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { ArticleTranslation } from './article-translation'
import { SiteLanguageProvider } from './site-language'

it('marks original and translated text across all reading modes without changing UI language', async () => {
  const language = vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['zh-CN'])
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
        <SiteLanguageProvider>
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
        </SiteLanguageProvider>
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
    expect(container.querySelector('[aria-label="双语阅读模式选择"]')?.hasAttribute('lang')).toBe(
      false
    )
    await press('仅译文')
    expect(container.querySelector('h1')?.lang).toBe('zh-CN')
    expect(container.querySelector('.article-content')?.getAttribute('lang')).toBe('zh-CN')
    await press('仅原文')
    expect(container.querySelector('h1')?.lang).toBe('en')
    expect(container.querySelector('.article-content')?.getAttribute('lang')).toBe('en')
    await act(async () =>
      root.render(
        <SiteLanguageProvider>
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
        </SiteLanguageProvider>
      )
    )
    expect(container.querySelector('h1')?.lang).toBe('en')
    expect(container.querySelector('.article-content')?.getAttribute('lang')).toBe('zh-CN')
  } finally {
    await act(async () => root.unmount())
    container.remove()
    language.mockRestore()
    vi.unstubAllGlobals()
  }
})

it('preserves the original content and hides Chinese translation for an English preference', async () => {
  const language = vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB'])
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () =>
      root.render(
        <SiteLanguageProvider>
          <ArticleTranslation
            articleId="one"
            source="openai"
            title="English article title"
            contentHtml="<p>This is the original text.</p>"
            summary={null}
            canTranslate
            sourceLabel={null}
            metadata={null}
          />
        </SiteLanguageProvider>
      )
    )
    expect(container.querySelector('h1')?.textContent).toBe('English article title')
    expect(container.querySelector('[aria-label="Article content"]')?.textContent).toContain(
      'This is the original text.'
    )
    expect(container.querySelector('button')).toBeNull()
    expect(fetcher).not.toHaveBeenCalled()
  } finally {
    await act(async () => root.unmount())
    container.remove()
    language.mockRestore()
    vi.unstubAllGlobals()
  }
})

it('renders structured Zhihu Q&A layout with answer headings, upvote badges, and TOC only for zhihu', async () => {
  const language = vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['zh-CN'])
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const zhihuHtml =
    '<blockquote><p>问题背景说明。</p></blockquote>' +
    '<div><h3><a href="https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214155" target="_blank" rel="nofollow noopener noreferrer" data-outbound="true">赵泠（1026 赞同）</a></h3><h2>核心观点</h2><p>第一条高赞回答。</p></div>' +
    '<div><hr /><h3><a href="https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214999" target="_blank" rel="nofollow noopener noreferrer" data-outbound="true">夏庆（119 赞同）</a></h3><p>第二条高赞回答。</p></div>'
  try {
    await act(async () =>
      root.render(
        <SiteLanguageProvider>
          <ArticleTranslation
            articleId="zhihu-1"
            source="zhihu"
            title="如何看待黎曼猜想证明被压缩？"
            contentHtml={zhihuHtml}
            summary={null}
            canTranslate={false}
            sourceLabel={<span>知乎热榜</span>}
            metadata={<span>2026-11-26</span>}
          />
        </SiteLanguageProvider>
      )
    )
    expect(container.textContent).toContain('问题背景')
    expect(container.textContent).toContain('精选高赞回答')
    expect(container.textContent).toContain('2 条回答')
    expect(container.textContent).toContain('1,026 赞同')
    expect(container.textContent).toContain('119 赞同')
    expect(Array.from(container.querySelectorAll('h2'), (node) => node.textContent)).toEqual([
      '赵泠',
      '夏庆'
    ])
    expect(Array.from(container.querySelectorAll('h3'), (node) => node.textContent)).toEqual([
      '核心观点'
    ])
    const answerLinks = Array.from(container.querySelectorAll('a[data-outbound="true"]')).map(
      (node) => node.getAttribute('href')
    )
    expect(answerLinks).toEqual([
      'https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214155',
      'https://www.zhihu.com/question/2109221701389239407/answer/2109245710856214999'
    ])
    expect(container.querySelector('button')?.textContent).toContain('文章目录 · 3 节')

    // Non-zhihu sources must keep standard article rendering
    await act(async () =>
      root.render(
        <SiteLanguageProvider>
          <ArticleTranslation
            articleId="other-1"
            source="hupu"
            title="其他来源帖子"
            contentHtml={zhihuHtml}
            summary={null}
            canTranslate={false}
            sourceLabel={<span>虎扑</span>}
            metadata={null}
          />
        </SiteLanguageProvider>
      )
    )
    expect(container.textContent).not.toContain('精选高赞回答')
  } finally {
    await act(async () => root.unmount())
    container.remove()
    language.mockRestore()
    vi.unstubAllGlobals()
  }
})
