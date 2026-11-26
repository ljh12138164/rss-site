'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSectionId, SignalSource } from '../lib/technology-sources'
import { getTransitLine } from '../lib/transit-lines'
import { RssSubscription } from './rss-subscription'
import { SiteShell } from './site-shell'
import { SourceNavigation } from './source-navigation'

export function SectionLayout({
  children,
  basePath,
  sectionId,
  sources
}: {
  children: ReactNode
  basePath: OutboundReturnPath
  sectionId: SignalSectionId
  sources: readonly SignalSource[]
}) {
  const tCommon = useTranslations('common')
  const tSections = useTranslations('sections')
  const tSources = useTranslations('sources')
  const tSourcePage = useTranslations('sourcePage')
  const pathname = usePathname()
  const segments = pathname.slice(basePath.length).split('/').filter(Boolean)
  const source = sources.find((s) => s.id === segments[0])

  const sourceDescription = source ? tSources(source.id) : undefined
  const sourceText =
    source && sourceDescription
      ? basePath === '/ai'
        ? {
            title:
              source.id === 'openai'
                ? tSourcePage('openaiTitle')
                : source.id === 'chatgpt'
                  ? tSourcePage('chatgptTitle')
                  : `${source.name} ${sourceDescription}`,
            description: tSourcePage('aiDescriptionTemplate', {
              name: source.name,
              description: sourceDescription
            })
          }
        : { title: source.name, description: sourceDescription }
      : undefined
  const line = getTransitLine(basePath)

  // Article details own their reading layout, outside the platform list shell.
  if (segments.length > 1 || (segments.length === 1 && !source)) return children

  return (
    <SiteShell>
      {source && (
        <nav aria-label={tCommon('breadcrumb')} className="mb-4">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <li>
              <Link className="transition-colors hover:text-primary" href="/">
                {tCommon('allStories')}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="transition-colors hover:text-primary" href={basePath}>
                {tSections(`${sectionId}.shortTitle`)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {source.shortName}
            </li>
          </ol>
        </nav>
      )}

      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {line && (
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: line.cssVar }}
              />
            )}
            <h1 className="headline-display text-2xl text-foreground sm:text-3xl">
              {sourceText?.title ?? tSections(`${sectionId}.pageTitle`)}
            </h1>
          </div>
          {source && sourceText?.description && (
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
              {sourceText.description}
            </p>
          )}
        </div>
        <RssSubscription key={basePath} basePath={basePath} sectionId={sectionId} />
      </header>

      <SourceNavigation
        active={source?.id}
        ariaLabel={tCommon('filterBySource')}
        basePath={basePath}
        lineColor={line?.cssVar}
        sources={sources}
      />

      <div className="mt-6 min-w-0">{children}</div>
    </SiteShell>
  )
}
