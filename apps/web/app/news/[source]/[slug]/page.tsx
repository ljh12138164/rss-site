import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { actionStyles } from '../../../../components/action-styles'
import { SiteShell } from '../../../../components/site-shell'
import { createNewsArticlePath, parseArticleIdFromSlug } from '../../../../lib/article-route'
import { getNewsArticle, type SignalArticle } from '../../../../lib/signal-article'
import { getNewsSource, isNewsSourceId, type NewsSource } from '../../../../lib/technology-sources'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ source: string; slug: string }> }

const loadArticle = cache(getNewsArticle)

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

async function resolveArticle(params: Props['params']) {
  const { source: sourceId, slug } = await params
  if (!isNewsSourceId(sourceId)) notFound()

  const articleId = parseArticleIdFromSlug(slug)
  if (!articleId) notFound()

  const article = await loadArticle(articleId, sourceId)
  if (!article) notFound()

  return { article, source: getNewsSource(sourceId) }
}

function canonicalUrl(path: string) {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) return undefined

  try {
    return new URL(path, siteUrl).toString()
  } catch {
    return undefined
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article, source } = await resolveArticle(params)
  const path = createNewsArticlePath(source.id, article.title, article.id)
  const canonical = canonicalUrl(path)

  return {
    title: article.title,
    description: article.summary ?? source.description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.summary ?? source.description,
      ...(canonical ? { url: canonical } : {}),
      ...(article.publishedAt ? { publishedTime: article.publishedAt.toISOString() } : {}),
      ...(article.author ? { authors: [article.author] } : {})
    }
  }
}

export function NewsArticleView({
  article,
  source
}: {
  article: SignalArticle
  source: NewsSource
}) {
  const returnTo = `/news/${source.id}` as const

  return (
    <SiteShell>
      <nav aria-label="面包屑">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <li>
            <Link
              className="inline-flex min-h-11 items-center transition-colors hover:text-primary"
              href="/"
            >
              首页
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="inline-flex min-h-11 items-center transition-colors hover:text-primary"
              href="/news"
            >
              新闻
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="inline-flex min-h-11 items-center transition-colors hover:text-primary"
              href={returnTo}
            >
              {source.shortName}
            </Link>
          </li>
        </ol>
      </nav>

      <article className="mt-10 max-w-3xl">
        <p className="text-sm font-medium text-primary">{source.name}</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] text-balance sm:text-5xl">
          {article.title}
        </h1>

        {article.author || article.publishedAt ? (
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {article.author ? <span>{article.author}</span> : null}
            {article.author && article.publishedAt ? <span aria-hidden="true">·</span> : null}
            {article.publishedAt ? (
              <time className="tabular-nums" dateTime={article.publishedAt.toISOString()}>
                {dateFormatter.format(article.publishedAt)}
              </time>
            ) : null}
          </div>
        ) : null}

        {article.summary ? (
          <section className="mt-10 border-y border-border py-7" aria-labelledby="article-summary">
            <h2 className="sr-only" id="article-summary">
              文章简介
            </h2>
            <p className="text-base leading-8 text-foreground sm:text-lg">{article.summary}</p>
          </section>
        ) : null}

        <div className="mt-8">
          <a
            className={actionStyles('primary', 'large')}
            href={`/out?url=${encodeURIComponent(article.url)}&from=%2Fnews`}
          >
            查看原文
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </article>
    </SiteShell>
  )
}

export default async function NewsArticlePage({ params }: Props) {
  const { article, source } = await resolveArticle(params)
  return <NewsArticleView article={article} source={source} />
}
