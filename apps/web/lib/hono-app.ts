import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { getEvent, validEventSlug } from './ai-events'
import { articleSource } from './article-route'
import {
  TranslationBusyError,
  translateArticleOnce,
  translateEventOnce
} from './article-translation'
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

const eventTranslationInput = validator('json', (value, c) => {
  if (!value || typeof value !== 'object') return c.json({ error: '请求格式无效' }, 400)
  const { slug } = value as Record<string, unknown>
  if (typeof slug !== 'string' || !validEventSlug(slug)) {
    return c.json({ error: '事件参数无效' }, 400)
  }
  return { slug }
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
  .post('/events/translate', eventTranslationInput, async (c) => {
    const { slug } = c.req.valid('json')

    try {
      const event = await getEvent(slug)
      if (!event) return c.json({ error: '事件不存在' }, 404)
      const translation = await translateEventOnce(event)
      return c.json({ translation }, 200)
    } catch (error) {
      if (error instanceof TranslationBusyError) {
        return c.json({ error: '翻译任务较多，请稍后重试' }, 429)
      }
      if (error instanceof Error && error.message === 'EVENT_NOT_ENGLISH') {
        return c.json({ error: '当前事件不是英文内容' }, 422)
      }
      return c.json({ error: '暂时无法翻译，请稍后重试' }, 503)
    }
  })

export type AppType = typeof app
