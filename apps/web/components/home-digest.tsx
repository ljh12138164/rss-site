import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { createArticlePath } from '../lib/article-route'
import type { HomeArticle, HomeDigest as HomeDigestData } from '../lib/home-articles'
import type { OutboundReturnPath } from '../lib/outbound-link'
import { SourceIcon } from './source-icon'

function getArticleHref(item: HomeArticle, returnTo: OutboundReturnPath = '/') {
  const section = item.section ?? returnTo
  const isReaderSection =
    section !== '/social' && section !== '/games' && item.platform.id !== 'github'
  const internalHref =
    isReaderSection && item.articleId
      ? createArticlePath(item.platform.id, item.title, item.articleId)
      : null

  return {
    href:
      internalHref ??
      `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(returnTo)}`,
    isInternal: Boolean(internalHref)
  }
}

/**
 * Editorial homepage digest: a top-signals strip plus per-section preview cards.
 * No infinite scroll — the front page is a directory, not a feed.
 */
export function HomeDigest({ digest }: { digest: HomeDigestData }) {
  return (
    <>
      {/* Top signals across all sections */}
      {digest.top.length > 0 && (
        <section aria-labelledby="top-signals" className="mt-10">
          <h2 id="top-signals" className="eyebrow">
            今日速览 · Top Signals
          </h2>
          <ol className="mt-4 border-y-2 border-strong">
            {digest.top.map((item) => {
              const { href, isInternal } = getArticleHref(item, '/')
              return (
                <li
                  key={item.articleId}
                  className="-mx-2 grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-border px-2 py-4 transition-colors last:border-b-0 hover:bg-row-highlight sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5"
                >
                  <span aria-hidden="true" className="rank-numeral" data-rank={item.position}>
                    {String(item.position).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <Link href={href} className="group block text-foreground">
                      <span className="inline-flex max-w-full items-start gap-1.5 font-serif text-base font-semibold leading-7 group-hover:text-primary sm:text-lg">
                        <span className="min-w-0 wrap-anywhere">{item.title}</span>
                        {isInternal ? (
                          <ArrowRight
                            aria-hidden="true"
                            className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        ) : (
                          <ArrowUpRight
                            aria-hidden="true"
                            className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        )}
                      </span>
                    </Link>
                    <p className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <SourceIcon className="size-4" source={item.platform} />
                      <span className="truncate">{item.platform.shortName}</span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* Per-section directory */}
      <section aria-labelledby="section-directory" className="mt-12 sm:mt-14">
        <h2 id="section-directory" className="eyebrow">
          分区导览 · Directory
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-px border-y-2 border-strong bg-border sm:grid-cols-2 lg:grid-cols-3">
          {digest.sections.map((section) => (
            <div key={section.path} className="flex flex-col bg-background p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-lg font-bold">{section.name}</h3>
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                  {section.tagline}
                </p>
              </div>
              <ol className="mt-4 flex-1 space-y-3 border-t border-border pt-4">
                {section.items.length === 0 && (
                  <li className="text-sm text-muted-foreground">暂无内容</li>
                )}
                {section.items.map((item) => {
                  const { href } = getArticleHref(item, section.path)
                  return (
                    <li key={item.articleId} className="min-w-0">
                      <Link
                        href={href}
                        className="group block text-sm leading-6 text-foreground/90 hover:text-primary"
                      >
                        <span className="line-clamp-2 wrap-anywhere">{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
              <Link
                href={section.path}
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary transition-colors hover:gap-2.5"
              >
                进入{section.name}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
