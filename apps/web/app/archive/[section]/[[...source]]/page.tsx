import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { HotList } from '../../../../components/hot-list'
import { SiteShell } from '../../../../components/site-shell'
import { articleArchiveHref } from '../../../../lib/article-archive'
import { getHomeArticles, parseArticleFilter, parseHomeCursor } from '../../../../lib/home-articles'
import { createPageMetadata } from '../../../../lib/seo'
import { findSignalSection, findSignalSource } from '../../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
type Props = {
  params: Promise<{ section: string; source?: string[] }>
  searchParams: Promise<{ cursor?: string | string[] }>
}

async function resolve({ params, searchParams }: Props) {
  const { section, source = [] } = await params
  const { cursor } = await searchParams
  if (source.length > 1 || source[0] === 'github') notFound()
  let filter: ReturnType<typeof parseArticleFilter>
  try {
    filter = parseArticleFilter(`/${section}`, source[0] ?? null)
  } catch {
    notFound()
  }
  const basePath = `/${section}${source[0] ? `/${source[0]}` : ''}`
  if (!cursor) redirect(basePath)
  if (typeof cursor !== 'string') notFound()
  let after: ReturnType<typeof parseHomeCursor>
  try {
    after = parseHomeCursor(cursor)
  } catch {
    notFound()
  }
  const label = source[0] ? findSignalSource(source[0])?.name : findSignalSection(section)?.title
  const path = articleArchiveHref(filter, cursor)
  if (!label || !path) notFound()
  return { filter, after, label, basePath, path }
}

export async function generateMetadata(props: Props) {
  const { path, label } = await resolve(props)
  return createPageMetadata({
    title: `${label} 历史文章`,
    description: `浏览${label}的更早文章，查看标题、摘要与原始来源。`,
    path
  })
}

export default async function ArticleArchive(props: Props) {
  const { filter, after, label, basePath } = await resolve(props)
  const page = await getHomeArticles(after, undefined, filter)
  if (!page.items.length) notFound()
  const nextPageHref = page.nextCursor ? articleArchiveHref(filter, page.nextCursor) : undefined
  return (
    <SiteShell>
      <header className="mb-8">
        <Link
          href={basePath}
          className="inline-flex min-h-11 items-center text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          返回{label}
        </Link>
        <h1 className="headline-display mt-3 text-balance text-4xl">{label} · 历史文章</h1>
      </header>
      <HotList
        returnTo={filter.section}
        source={filter.source}
        items={page.items.map((item) => ({
          ...item,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null
        }))}
      />
      {nextPageHref && (
        <nav aria-label="历史文章分页" className="mt-6">
          <Link
            href={nextPageHref}
            prefetch={false}
            className="inline-flex min-h-11 items-center text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            下一页
          </Link>
        </nav>
      )}
    </SiteShell>
  )
}
