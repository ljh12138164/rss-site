import path from 'node:path'
import type { MTran } from 'mtranserver'
import type { AiEvent } from './ai-events'
import { renderArticleContent } from './article-content'
import { looksLikeEnglish } from './article-language'
import type { SignalArticle } from './signal-article'

export interface ArticleTranslation {
  title: string
  contentHtml: string | null
  summary: string | null
}

export interface EventTranslation {
  title: string
  summary: string
}

type Translate = (text: string, html?: boolean) => Promise<string>

let enginePromise: Promise<MTran> | undefined
const translationsInFlight = new Map<string, Promise<unknown>>()
const maxDistinctTranslations = 2

function modelPath(name: 'config' | 'models') {
  return path.join(process.cwd(), '.mtran', name)
}

async function getEngine() {
  if (!enginePromise) {
    enginePromise = (async () => {
      const { MTran } = await import('mtranserver')
      const engine = new MTran({
        configDir: process.env.MT_CONFIG_DIR ?? modelPath('config'),
        modelDir: process.env.MT_MODEL_DIR ?? modelPath('models'),
        cacheSize: 32,
        checkUpdate: false,
        logConsole: false,
        logToFile: false,
        workerIdleTimeout: 300
      })
      try {
        await engine.init()
        await engine.downloadModel('en', 'zh')
        return engine
      } catch (error) {
        await engine.close().catch(() => undefined)
        throw error
      }
    })().catch((error) => {
      enginePromise = undefined
      throw error
    })
  }
  return enginePromise
}

async function translateWithMTran(text: string, html = false) {
  const engine = await getEngine()
  return engine.translate('en', 'zh', text, html)
}

export async function translateArticle(
  article: SignalArticle,
  section: string,
  translate: Translate = translateWithMTran
): Promise<ArticleTranslation> {
  const contentHtml = article.contentHtml
    ? renderArticleContent(article.contentHtml, article.url, section)
    : ''
  const sourceText = `${article.title}\n${contentHtml || article.summary || ''}`
  if (!looksLikeEnglish(sourceText)) throw new Error('ARTICLE_NOT_ENGLISH')

  const title = (await translate(article.title)).trim()
  const translatedBody = contentHtml ? await translate(contentHtml, true) : ''
  const translatedSummary =
    !contentHtml && article.summary ? await translate(article.summary) : null

  return {
    title: title || article.title,
    contentHtml: translatedBody ? renderArticleContent(translatedBody, article.url, section) : null,
    summary: translatedSummary?.trim() || null
  }
}

export class TranslationBusyError extends Error {}

function runTranslationOnce<T>(key: string, translate: () => Promise<T>) {
  const existing = translationsInFlight.get(key)
  if (existing) return existing as Promise<T>
  if (translationsInFlight.size >= maxDistinctTranslations) throw new TranslationBusyError()

  const task = translate().finally(() => {
    translationsInFlight.delete(key)
  })
  translationsInFlight.set(key, task)
  return task
}

export function translateArticleOnce(article: SignalArticle, section: string) {
  return runTranslationOnce(`article:${article.id}`, () => translateArticle(article, section))
}

export async function translateEvent(
  event: AiEvent,
  translate: Translate = translateWithMTran
): Promise<EventTranslation> {
  if (!looksLikeEnglish(`${event.title}\n${event.summary}`)) throw new Error('EVENT_NOT_ENGLISH')

  const title = (await translate(event.title)).trim()
  const summary = (await translate(event.summary)).trim()
  return {
    title: title || event.title,
    summary: summary || event.summary
  }
}

export function translateEventOnce(event: AiEvent) {
  return runTranslationOnce(`event:${event.id}`, () => translateEvent(event))
}
