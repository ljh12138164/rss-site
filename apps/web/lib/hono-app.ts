import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { articleSource } from './article-route'
import { TranslationBusyError, translateArticleOnce } from './article-translation'
import { getNewsArticle } from './signal-article'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const translationInput = validator('json', (value, c) => {
  if (!value || typeof value !== 'object') return c.json({ error: '请求格式无效' }, 400)
  const { id, source } = value as Record<string, unknown>
  if (typeof id !== 'string' || !uuidPattern.test(id) || typeof source !== 'string') {
    return c.json({ error: '文章参数无效' }, 400)
  }
  return { id: id.toLowerCase(), source }
})

export const app = new Hono()
  .basePath('/api')
  .post('/articles/translate', translationInput, async (c) => {
    const { id, source } = c.req.valid('json')
    const entry = articleSource(source)
    if (!entry) return c.json({ error: '文章来源无效' }, 400)

    try {
      const article = await getNewsArticle(id, entry.source.id)
      if (!article) return c.json({ error: '文章不存在' }, 404)
      const translation = await translateArticleOnce(article, entry.section.id)
      return c.json({ translation }, 200)
    } catch (error) {
      if (error instanceof TranslationBusyError) {
        return c.json({ error: '翻译任务较多，请稍后重试' }, 429)
      }
      if (error instanceof Error && error.message === 'ARTICLE_NOT_ENGLISH') {
        return c.json({ error: '当前文章不是英文内容' }, 422)
      }
      return c.json({ error: '暂时无法翻译，请稍后重试' }, 503)
    }
  })

export type AppType = typeof app
