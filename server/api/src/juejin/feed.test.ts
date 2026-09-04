import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseJuejinFeed } from './feed'

const fixtureUrl = new URL('./fixtures/trending.xml', import.meta.url)

describe('parseJuejinFeed', () => {
  it('preserves RSS order and normalizes stable article fields', async () => {
    const xml = await readFile(fileURLToPath(fixtureUrl), 'utf8')

    expect(parseJuejinFeed(xml)).toEqual([
      {
        sourceKey: 'https://juejin.cn/post/123',
        title: '第一篇热点文章',
        url: 'https://juejin.cn/post/123',
        summary: '第一篇 摘要 & 更多内容',
        author: '示例作者',
        publishedAt: new Date('2026-09-03T08:00:00.000Z'),
        position: 1
      },
      {
        sourceKey: 'https://juejin.cn/post/456',
        title: '第二篇热点文章',
        url: 'https://juejin.cn/post/456',
        summary: '只有摘要，没有作者与时间。',
        author: null,
        publishedAt: null,
        position: 2
      }
    ])
  })

  it.each([
    ['malformed XML', '<rss><channel>'],
    ['an empty feed', '<rss><channel><title>empty</title></channel></rss>'],
    [
      'an item without a title',
      '<rss><channel><item><link>https://juejin.cn/post/1</link></item></channel></rss>'
    ],
    [
      'an item without a Juejin link',
      '<rss><channel><item><title>missing link</title></item></channel></rss>'
    ]
  ])('rejects %s so existing rankings cannot be cleared', (_case, xml) => {
    expect(() => parseJuejinFeed(xml)).toThrow()
  })
})
