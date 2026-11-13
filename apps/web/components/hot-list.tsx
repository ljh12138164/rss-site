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
  if (!items.length) return null

  return (
    <ol className="divide-y divide-border rounded-sm border border-border bg-card">
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
        const hasImage = Boolean(item.imageUrl?.trim())

        return (
          <li
            className="group/row px-4 py-3.5 transition-colors hover:bg-row-highlight focus-within:bg-row-highlight sm:px-5 sm:py-4"
            key={`${sourceId ?? ''}:${item.sourceKey}`}
          >
            <article className="min-w-0">
              <div
                className={
                  hasImage
                    ? 'grid min-w-0 grid-cols-[minmax(0,1fr)_88px] gap-4 sm:grid-cols-[minmax(0,1fr)_120px]'
                    : 'min-w-0'
                }
              >
                <div className="min-w-0">
                  <LinkComponent
                    className="group block min-w-0 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    href={href}
                    {...outboundProps}
                  >
                    <span className="flex min-w-0 items-start gap-1.5 text-[0.9375rem] font-semibold leading-6 group-hover:text-primary sm:text-base">
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
                      <span className="mt-1.5 line-clamp-2 block text-pretty text-sm leading-6 text-muted-foreground">
                        {item.summary}
                      </span>
                    ) : null}
                  </LinkComponent>

                  <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-muted-foreground">
                    {platform && (
                      <Link
                        href={`${item.section ?? returnTo}/${platform.id}`}
                        aria-label={`浏览 ${platform.name}`}
                        className="inline-flex min-h-8 max-w-full items-center gap-1.5 font-sans hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <SourceIcon className="size-3.5 shrink-0" source={platform} />
                        <span className="truncate font-medium">{platform.shortName}</span>
                      </Link>
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
                      className="ml-auto size-8 shrink-0"
                    />
                  </div>
                </div>

                {hasImage && (
                  <CoverImage
                    src={item.imageUrl}
                    previewLabel={item.title}
                    width={160}
                    height={100}
                    className="w-[88px] rounded-sm sm:w-[120px]"
                  />
                )}
              </div>
            </article>
          </li>
        )
      })}
    </ol>
  )
}
