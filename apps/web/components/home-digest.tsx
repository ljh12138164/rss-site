import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { createArticlePath } from '../lib/article-route'
import type { HomeArticle, HomeDigest as HomeDigestData } from '../lib/home-articles'
import type { OutboundReturnPath } from '../lib/outbound-link'
import { CoverImage } from './cover-image'
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
    href: internalHref ?? item.url,
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
        <section aria-labelledby="top-signals" className="mt-10 sm:mt-12">
          <h2 id="top-signals" className="eyebrow">
            今日速览
          </h2>
          <ol className="mt-4 border-y border-border">
            {digest.top.map((item) => {
              const { href, isInternal } = getArticleHref(item, '/')
              return (
                <li
                  key={item.articleId}
                  className="group/row my-1 grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3 rounded-lg border-b border-border/60 px-3 py-4 transition-colors duration-150 last:border-b-0 hover:bg-row-highlight/60 focus-within:bg-row-highlight/60 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
                >
                  <CoverImage
                    src={item.imageUrl}
                    previewLabel={item.title}
                    className="w-24 transition-colors duration-150 group-hover/row:border-primary/20 sm:w-36"
                    fallback={
                      <SourceIcon
                        source={item.platform}
                        className="size-10 text-base sm:size-12 [&>svg]:size-7 sm:[&>svg]:size-8"
                      />
                    }
                  />
                  <div className="min-w-0">
                    {(() => {
                      const LinkComponent = isInternal ? Link : 'a'
                      const outboundProps = isInternal
                        ? {}
                        : {
                            target: '_blank',
                            rel: 'noreferrer noopener external',
                            'data-outbound': ''
                          }
                      return (
                        <LinkComponent
                          href={href}
                          className="group block min-h-11 text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                          {...outboundProps}
                        >
                          <span className="inline-flex max-w-full items-start gap-1.5 font-serif text-base font-semibold leading-7 group-hover:text-primary sm:text-lg">
                            <span className="min-w-0 line-clamp-2 wrap-anywhere" title={item.title}>
                              {item.title}
                            </span>
                            {isInternal ? (
                              <ArrowRight
                                aria-hidden="true"
                                className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-1 group-hover:text-primary"
                              />
                            ) : (
                              <ArrowUpRight
                                aria-hidden="true"
                                className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                              />
                            )}
                          </span>
                        </LinkComponent>
                      )
                    })()}
                    <p className="mt-1.5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <SourceIcon className="size-4 shrink-0" source={item.platform} />
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
          分区导览
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {digest.sections.map((section) => (
            <div key={section.path} className="flex flex-col bg-background p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-lg font-bold">{section.name}</h3>
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                  {section.tagline}
                </p>
              </div>
              <ol className="mt-4 flex-1 space-y-3 border-t border-border/80 pt-4">
                {section.items.length === 0 && (
                  <li className="text-sm text-muted-foreground">暂无内容</li>
                )}
                {section.items.map((item) => {
                  const { href, isInternal } = getArticleHref(item, section.path)
                  const LinkComponent = isInternal ? Link : 'a'
                  const outboundProps = isInternal
                    ? {}
                    : {
                        target: '_blank',
                        rel: 'noreferrer noopener external',
                        'data-outbound': ''
                      }
                  return (
                    <li
                      key={item.articleId}
                      className="group/row grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-row-highlight/60 focus-within:bg-row-highlight/60"
                    >
                      <CoverImage
                        src={item.imageUrl}
                        previewLabel={item.title}
                        className="w-18 transition-colors duration-150 group-hover/row:border-primary/20"
                        fallback={
                          <SourceIcon source={item.platform} className="size-7 [&>svg]:size-5" />
                        }
                      />
                      <LinkComponent
                        href={href}
                        className="group block min-h-11 min-w-0 text-sm leading-6 text-foreground/90 transition-colors duration-150 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                        {...outboundProps}
                      >
                        <span className="line-clamp-2 wrap-anywhere">{item.title}</span>
                      </LinkComponent>
                    </li>
                  )
                })}
              </ol>
              <Link
                href={section.path}
                className="group/btn mt-4 inline-flex min-h-11 items-center gap-1.5 border-t border-border/80 pt-3 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                进入{section.name}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-150 group-hover/btn:translate-x-1"
                />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
