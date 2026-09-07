import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { renderArticleContent } from '../lib/article-content'
import { articleSource, createArticlePath, parseArticleIdFromSlug } from '../lib/article-route'
import { getNewsArticle, type SignalArticle } from '../lib/signal-article'
import { optionalCanonical } from '../lib/site-url'
import type { SignalSource } from '../lib/technology-sources'
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
  const canonical = optionalCanonical(createArticlePath(article.source, article.title, article.id))
  return {
    title: article.title,
    description: article.summary?.slice(0, 200) ?? undefined,
    robots: { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.summary?.slice(0, 200) ?? undefined,
      url: canonical,
      publishedTime: article.publishedAt?.toISOString()
    }
  }
}

export function ArticleReader({
  article,
  source
}: {
  article: SignalArticle
  source: SignalSource
}) {
  const entry = articleSource(source.id)
  if (!entry) return null
  const section = entry.section
  const body = article.contentHtml
    ? renderArticleContent(article.contentHtml, article.url, section.id)
    : ''
  const hasBody = body.replace(/<[^>]*>/g, '').trim().length > 0
  const outbound = `/out?url=${encodeURIComponent(article.url)}&from=${encodeURIComponent(`/${section.id}`)}`

  return (
    <SiteShell mainClassName="py-6 sm:py-10">
      <article className="mx-auto w-full max-w-[46rem] min-w-0">
        <nav
          aria-label="面包屑"
          className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <Link className="inline-flex min-h-11 items-center hover:text-primary" href="/">
            首页
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="inline-flex min-h-11 items-center hover:text-primary"
            href={`/${section.id}`}
          >
            {section.title}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="inline-flex min-h-11 items-center hover:text-primary"
            href={`/${section.id}/${source.id}`}
          >
            {source.shortName}
          </Link>
        </nav>
        <header className="border-b border-border pb-7 sm:pb-9">
          <div className="mb-5 flex items-center gap-2.5 text-sm font-medium text-primary">
            <SourceIcon source={source} className="size-5" />
            <span>{source.name}</span>
          </div>
          <h1 className="text-pretty text-3xl font-semibold leading-tight tracking-tight sm:text-4xl sm:leading-snug">
            {article.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {article.author && <span>{article.author}</span>}
            {article.publishedAt && (
              <time dateTime={article.publishedAt.toISOString()}>
                {dateFormatter.format(article.publishedAt)}
              </time>
            )}
            <a
              href={outbound}
              className="inline-flex min-h-11 items-center gap-1 hover:text-primary"
            >
              查看原文
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </header>
        <section aria-label={hasBody ? '文章内容' : '文章摘要'} className="py-8 sm:py-10">
          {hasBody ? (
            // biome-ignore lint/security/noDangerouslySetInnerHtml: renderArticleContent applies a strict HTML and URL allowlist on the server.
            <div className="article-content" dangerouslySetInnerHTML={{ __html: body }} />
          ) : article.summary ? (
            <div className="article-content">
              <p className="mb-5 text-sm text-muted-foreground">文章摘要</p>
              <p className="whitespace-pre-line">{article.summary}</p>
            </div>
          ) : (
            <p className="text-base leading-8 text-muted-foreground">
              来源暂未提供可在站内阅读的内容，可以前往原文查看。
            </p>
          )}
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border py-6">
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            内容来自{source.name}，可能为节选。完整内容与后续更新以原文为准。
          </p>
          <a
            href={outbound}
            className="inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:underline"
          >
            阅读原文
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </footer>
      </article>
    </SiteShell>
  )
}

export async function renderArticlePage(props: ArticlePageProps, section: string) {
  return <ArticleReader {...(await resolveArticle(props.params, section))} />
}
