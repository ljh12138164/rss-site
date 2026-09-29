import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArticleTranslation } from './article-translation'

const props = {
  articleId: '11111111-1111-1111-1111-111111111111',
  source: 'openai',
  title: 'Introducing OpenAI o3',
  contentHtml: '<p>OpenAI releases a new reasoning model.</p>',
  summary: 'OpenAI o3 model summary.',
  canTranslate: true,
  sourceLabel: <span>OpenAI</span>,
  metadata: <span>2026-09-25</span>
}

describe('ArticleTranslation', () => {
  it('renders original title and content with translation action', () => {
    const html = renderToStaticMarkup(<ArticleTranslation {...props} />)
    expect(html).toContain('Introducing OpenAI o3')
    expect(html).toContain('OpenAI releases a new reasoning model.')
    expect(html).toContain('翻译为中文')
  })

  it('hides translation action when canTranslate is false', () => {
    const html = renderToStaticMarkup(<ArticleTranslation {...props} canTranslate={false} />)
    expect(html).toContain('Introducing OpenAI o3')
    expect(html).not.toContain('翻译为中文')
  })

  it('renders summary when contentHtml is empty', () => {
    const html = renderToStaticMarkup(<ArticleTranslation {...props} contentHtml="" />)
    expect(html).toContain('OpenAI o3 model summary.')
    expect(html).toContain('文章摘要')
  })
})
