import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { HotList } from '../../../../components/hot-list'
import { TranslatedRegion, TranslatedText } from '../../../../components/site-language'
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
  const sourceMeta = source[0] ? findSignalSource(source[0]) : undefined
  const sectionMeta = findSignalSection(section)
  const label = sourceMeta?.name ?? sectionMeta?.title
  const path = articleArchiveHref(filter, cursor)
  if (!label || !path || !sectionMeta) notFound()
  return {
    filter,
    after,
    label,
    sourceName: sourceMeta?.name,
    sectionId: sectionMeta.id,
    basePath,
    path
  }
}

export async function generateMetadata(props: Props) {
  const { path, label } = await resolve(props)
  return {
    ...createPageMetadata({
      title: `${label} 历史文章`,
      description: `浏览${label}的更早文章，查看标题、摘要与原始来源。`,
      path
    }),
    robots: { index: false, follow: false }
  }
}

export default async function ArticleArchive(props: Props) {
  const { filter, after, sourceName, sectionId, basePath } = await resolve(props)
  const page = await getHomeArticles(after, undefined, filter)
  if (!page.items.length) notFound()
  const nextPageHref = page.nextCursor ? articleArchiveHref(filter, page.nextCursor) : undefined
  const labelNode = sourceName ? sourceName : <TranslatedText id={`sections.${sectionId}.title`} />
  return (
    <SiteShell>
      <header className="mb-8">
        <Link
          href={basePath}
          className="inline-flex min-h-11 items-center text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <TranslatedText id="common.back" /> {labelNode}
        </Link>
        <h1 className="headline-display mt-3 text-balance text-4xl">
          {labelNode} <TranslatedText id="errors.archiveSuffix" />
        </h1>
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
        <TranslatedRegion as="nav" labelId="errors.archivePagination" className="mt-6">
          <Link
            href={nextPageHref}
            prefetch={false}
            rel="nofollow"
            className="inline-flex min-h-11 items-center text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <TranslatedText id="errors.nextPage" />
          </Link>
        </TranslatedRegion>
      )}
    </SiteShell>
  )
}
