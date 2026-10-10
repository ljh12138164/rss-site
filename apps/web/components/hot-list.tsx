import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { createArticlePath } from '../lib/article-route'
import type { HotItem } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import { findSignalSource, type SignalSource } from '../lib/technology-sources'
import { ArticleBookmarkButton } from './article-bookmark-button'
import { CoverImage } from './cover-image'
import { GitHubRepositoryRow } from './github-repository-row'
import { SourceIcon } from './source-icon'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Shanghai'
})

export function HotList({
  items,
  returnTo = '/technology',
  source
}: {
  items: (HotItem & { platform?: SignalSource; section?: OutboundReturnPath })[]
  returnTo?: OutboundReturnPath
  source?: string
}) {
  return (
    <ol className="border-y border-border">
      {items.map((item) => {
        const sourceId = item.platform?.id ?? source
        const platform = item.platform ?? (sourceId ? findSignalSource(sourceId) : undefined)
        if (sourceId === 'github') {
          return (
            <GitHubRepositoryRow
              item={item}
              key={`${sourceId}:${item.sourceKey}`}
              returnTo={returnTo}
            />
          )
        }
        const internalHref =
          sourceId && item.articleId
            ? createArticlePath(sourceId, item.title, item.articleId)
            : null
        const isInternal = Boolean(internalHref)
        const href = internalHref ?? item.url
        const LinkComponent = isInternal ? Link : 'a'
        const outboundProps = isInternal
          ? {}
          : { target: '_blank', rel: 'noreferrer noopener external', 'data-outbound': '' }

        return (
          <li
            className="border-b border-border/80 py-4 last:border-b-0 hover:bg-row-highlight"
            key={`${sourceId ?? ''}:${item.sourceKey}`}
          >
            <article className="grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-4">
              <LinkComponent
                className="group col-span-2 grid min-w-0 grid-cols-subgrid items-start text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                href={href}
                {...outboundProps}
              >
                <CoverImage
                  src={item.imageUrl}
                  className="w-24 sm:w-36"
                  fallback={
                    platform ? (
                      <SourceIcon
                        source={platform}
                        className="size-10 text-base sm:size-12 [&>svg]:size-7 sm:[&>svg]:size-8"
                      />
                    ) : undefined
                  }
                />
                <span className="block min-w-0">
                  <span className="flex min-w-0 items-start gap-1.5 text-base font-semibold leading-6 group-hover:text-primary">
                    <span className="min-w-0 line-clamp-2 wrap-anywhere" title={item.title}>
                      {item.title}
                    </span>
                    {internalHref ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                      />
                    ) : (
                      <ArrowUpRight
                        aria-hidden="true"
                        className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                      />
                    )}
                  </span>
                  {item.summary ? (
                    <span className="mt-1.5 line-clamp-2 text-pretty text-sm leading-5 text-muted-foreground">
                      {item.summary}
                    </span>
                  ) : null}
                </span>
              </LinkComponent>
              <div className="col-start-2 mt-1 flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {platform ? (
                  <Link
                    href={`${item.section ?? returnTo}/${platform.id}`}
                    aria-label={`浏览${platform.name}`}
                    className="inline-flex min-h-8 max-w-full items-center gap-1.5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <SourceIcon className="size-3.5 shrink-0" source={platform} />
                    <span className="truncate">{platform.shortName}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {item.author ? <span className="max-w-28 truncate">{item.author}</span> : null}
                {item.publishedAt ? (
                  <time
                    className="whitespace-nowrap tabular-nums"
                    dateTime={item.publishedAt.toISOString()}
                  >
                    {dateFormatter.format(item.publishedAt)}
                  </time>
                ) : null}
                <ArticleBookmarkButton
                  id={item.articleId ?? item.sourceKey}
                  title={item.title}
                  url={internalHref ?? item.url}
                  source={sourceId}
                  sourceName={platform?.name}
                  section={returnTo.replace(/^\//, '')}
                  variant="icon"
                  className="ml-auto size-11 shrink-0"
                />
              </div>
            </article>
          </li>
        )
      })}
    </ol>
  )
}
