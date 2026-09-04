import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HotList } from './hot-list'

describe('HotList', () => {
  it('renders ranked items with safe external links and readable metadata', () => {
    const html = renderToStaticMarkup(
      <HotList
        items={[
          {
            sourceKey: 'article-1',
            title: '构建可靠的前端应用',
            url: 'https://juejin.cn/post/1',
            summary: '从边界状态和数据流开始设计。',
            author: '示例作者',
            publishedAt: new Date('2026-09-04T01:00:00.000Z'),
            position: 1
          }
        ]}
      />
    )

    expect(html).toContain('01')
    expect(html).toContain('构建可靠的前端应用')
    expect(html).toContain('从边界状态和数据流开始设计。')
    expect(html).toContain('示例作者')
    expect(html).toContain('href="https://juejin.cn/post/1"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer noopener"')
  })
})
