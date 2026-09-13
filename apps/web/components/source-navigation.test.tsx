import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { aiSources } from '../lib/technology-sources'
import { SourceNavigation } from './source-navigation'

describe('SourceNavigation', () => {
  it('shows the current section sources with short, recognizable names', () => {
    const html = renderToStaticMarkup(
      <SourceNavigation active="glm" ariaLabel="AI 内容来源" basePath="/ai" sources={aiSources} />
    )

    expect(html).toContain('内容来源')
    expect(html).toContain('>全部<')
    expect(html).toContain('>GLM<')
    expect(html).toContain('>Gemini<')
    expect(html).toContain('>ChatGPT<')
    expect(html).toContain('href="/ai/chatgpt"')
    expect(html).toContain('href="/ai/google-ai"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('src="/source-icons/openai.svg"')
    expect(html).toContain('src="/source-icons/glm.svg"')
    expect(html).not.toContain('Google AI / Gemini')
    expect(html).not.toContain('2H')
  })
})
