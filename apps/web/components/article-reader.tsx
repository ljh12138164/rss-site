import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { renderArticleContent } from '../lib/article-content'
import { looksLikeEnglish } from '../lib/article-language'
import { articleSource, createArticlePath, parseArticleIdFromSlug } from '../lib/article-route'
import {
  articleDescription,
  createArticleStructuredData,
  createPageMetadata,
  serializeStructuredData
} from '../lib/seo'
import { getNewsArticle, getSameSourceArticles, type SignalArticle } from '../lib/signal-article'
import { optionalCanonical } from '../lib/site-url'
import type { SignalSource } from '../lib/technology-sources'
import { ArticleBookmarkButton } from './article-bookmark-button'
import { ArticleHistoryTracker } from './article-history-tracker'
import { ArticleTranslation } from './article-translation'
import { SiteShell } from './site-shell'
import { SourceIcon } from './source-icon'

export type ArticlePageProps = { params: Promise<{ source: string; slug: string }> }
const loadArticle = cache(getNewsArticle)
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Asia/Shanghai'
})

async function resolveArticle(params: ArticlePageProps['params'], section: string) {
  const { source, slug } = await params
  const entry = articleSource(source)
  const id = parseArticleIdFromSlug(slug)
  if (!entry || entry.section.id !== section || !id) notFound()
  const article = await loadArticle(id, entry.source.id)
  if (!article) notFound()
  return { article, source: entry.source }
}

export async function articleMetadata(props: ArticlePageProps, section: string): Promise<Metadata> {
  const { article } = await resolveArticle(props.params, section)
  const path = createArticlePath(article.source, article.title, article.id)
  const description = articleDescription(
    article.summary,
    renderArticleContent(article.contentHtml ?? '', article.url)
  )
  const modifiedAt = article.contentUpdatedAt ?? article.lastSeenAt
  return {
    ...createPageMetadata({
      title: article.title,
      description: description ?? article.title,
      path,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: modifiedAt.toISOString()
    }),
    robots: { index: article.isIndexable === true, follow: true }
  }
}

export function ArticleReader({
  article,
  source,
  related = []
}: {
  article: SignalArticle
  source: SignalSource
  related?: { id: string; title: string; source: string }[]
}) {
  const entry = articleSource(source.id)
  if (!entry) return null
  const section = entry.section
  const body = article.contentHtml
    ? renderArticleContent(article.contentHtml, article.url, section.id)
    : ''
  const canTranslate = looksLikeEnglish(`${article.title}\n${body || article.summary || ''}`)
  const modifiedAt = article.contentUpdatedAt ?? article.lastSeenAt
  const canonical = optionalCanonical(createArticlePath(article.source, article.title, article.id))
  const structuredJson = canonical
    ? serializeStructuredData(
        createArticleStructuredData({
          type:
            section.id === 'news' || section.id === 'finance'
              ? 'NewsArticle'
              : section.id === 'ai' || section.id === 'technology'
                ? 'TechArticle'
                : 'Article',
          canonical,
          title: article.title,
          ...(article.summary ? { description: article.summary } : {}),
          sourceUrl: article.url,
          sourceName: source.name,
          sectionName: section.title,
          sectionPath: `/${section.id}`,
          sourcePath: `/${section.id}/${source.id}`,
          ...(article.publishedAt ? { publishedAt: article.publishedAt.toISOString() } : {}),
          modifiedAt: modifiedAt.toISOString(),
          ...(article.author ? { author: article.author } : {}),
          language: canTranslate ? 'en' : 'zh-CN'
        })
      )
    : undefined
  const outbound = article.url

  return (
    <SiteShell mainClassName="py-6 sm:py-10">
      <ArticleHistoryTracker
        id={article.id}
        title={article.title}
        url={article.url}
        source={source.id}
        sourceName={source.name}
        section={section.id}
      />
      <article className="mx-auto w-full max-w-[46rem] min-w-0">
        <nav
          aria-label="面包屑"
          className="mb-8 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground"
        >
          <Link
            className="inline-flex min-h-11 items-center transition-colors hover:text-primary"
            href="/"
          >
            首页
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="inline-flex min-h-11 items-center transition-colors hover:text-primary"
            href={`/${section.id}`}
          >
            {section.title}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="inline-flex min-h-11 items-center transition-colors hover:text-primary"
            href={`/${section.id}/${source.id}`}
          >
            {source.shortName}
          </Link>
        </nav>
        <ArticleTranslation
          articleId={article.id}
          source={source.id}
          title={article.title}
          contentHtml={body}
          summary={article.summary}
          canTranslate={canTranslate}
          sourceLabel={
            <div className="mb-5 flex items-center gap-2.5 text-sm font-medium text-primary">
              <SourceIcon source={source} className="size-5" />
              <span>{source.name}</span>
            </div>
          }
          metadata={
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
              {article.author && <span>{article.author}</span>}
              {article.publishedAt && (
                <time dateTime={article.publishedAt.toISOString()}>
                  {dateFormatter.format(article.publishedAt)}
                </time>
              )}
              <a
                href={outbound}
                target="_blank"
                rel="noreferrer noopener external"
                data-outbound
                className="group inline-flex min-h-11 items-center gap-1 transition-colors hover:text-primary"
              >
                查看原文
                <ArrowUpRight
                  className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </a>
              <ArticleBookmarkButton
                id={article.id}
                title={article.title}
                url={article.url}
                source={source.id}
                sourceName={source.name}
                section={section.id}
              />
            </div>
          }
        />
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border py-6">
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            内容来自{source.name}，可能为节选。完整内容与后续更新以原文为准。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ArticleBookmarkButton
              id={article.id}
              title={article.title}
              url={article.url}
              source={source.id}
              sourceName={source.name}
              section={section.id}
            />
            <a
              href={outbound}
              className="group inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:underline"
            >
              阅读原文
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </footer>
        {related.length > 0 && (
          <section
            className="mt-6 border-t border-border pt-6"
            aria-labelledby="same-source-articles"
          >
            <h2 id="same-source-articles" className="text-balance text-lg font-semibold">
              同来源文章
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    className="inline-flex min-h-11 items-center text-pretty text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                    href={createArticlePath(item.source, item.title, item.id)}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {structuredJson && <script type="application/ld+json">{structuredJson}</script>}
      </article>
    </SiteShell>
  )
}

export async function renderArticlePage(props: ArticlePageProps, section: string) {
  const resolved = await resolveArticle(props.params, section)
  const related = await getSameSourceArticles(resolved.article.id, resolved.source.id).catch(
    () => []
  )
  return <ArticleReader {...resolved} related={related} />
}
