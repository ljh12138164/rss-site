import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createArticlePath } from '../lib/article-route'
import type { HomeArticle, HomeDigest as HomeDigestData } from '../lib/home-articles'
import type { OutboundReturnPath } from '../lib/outbound-link'
import { CoverImage } from './cover-image'
import { HomeHotRanking } from './home-hot-ranking'
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
      <HomeHotRanking ranking={digest.ranking} />

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
