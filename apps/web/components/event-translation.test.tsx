import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EventTranslation } from './event-translation'

const props = {
  slug: 'openai-launches-gpt-5',
  title: 'OpenAI launches GPT-5',
  summary: 'OpenAI announced a new flagship model.',
  dateTime: '2026-01-01T00:00:00Z',
  dateLabel: '2026/1/1'
}

describe('EventTranslation', () => {
  it('offers translation for an English event', () => {
    const html = renderToStaticMarkup(<EventTranslation {...props} canTranslate />)

    expect(html).toContain('翻译为中文')
    expect(html).toContain(props.title)
    expect(html).toContain(props.summary)
    expect(html).not.toContain('由本地 MTranServer 模型生成')
  })

  it('does not offer translation for a non-English event', () => {
    const html = renderToStaticMarkup(
      <EventTranslation
        {...props}
        title="中文事件标题"
        summary="这是一段中文事件摘要。"
        canTranslate={false}
      />
    )

    expect(html).not.toContain('翻译为中文')
  })
})
