'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import type { OutboundReturnPath } from '../lib/outbound-link'
import { aiSourcePageText } from '../lib/source-page-text'
import type { SignalSource } from '../lib/technology-sources'
import { getTransitLine } from '../lib/transit-lines'
import { RssSubscription } from './rss-subscription'
import { SiteShell } from './site-shell'
import { SourceNavigation } from './source-navigation'

export function SectionLayout({
  children,
  basePath,
  title,
  description: _description,
  sectionName,
  sources
}: {
  children: ReactNode
  basePath: OutboundReturnPath
  title: string
  description: string
  sectionName: string
  sources: readonly SignalSource[]
}) {
  const pathname = usePathname()
  const segments = pathname.slice(basePath.length).split('/').filter(Boolean)
  const source = sources.find((s) => s.id === segments[0])
  const sourceText = source
    ? basePath === '/ai'
      ? aiSourcePageText(source)
      : { title: source.name, description: source.description }
    : undefined
  const line = getTransitLine(basePath)

  // Article details own their reading layout, outside the platform list shell.
  if (segments.length > 1 || (segments.length === 1 && !source)) return children

  return (
    <SiteShell>
      {source && (
        <nav aria-label="面包屑" className="mb-4">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <li>
              <Link className="transition-colors hover:text-primary" href="/">
                全部热点
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="transition-colors hover:text-primary" href={basePath}>
                {sectionName}
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
              {sourceText?.title ?? title}
            </h1>
          </div>
          {source && sourceText?.description && (
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
              {sourceText.description}
            </p>
          )}
        </div>
        <RssSubscription key={basePath} basePath={basePath} sectionName={sectionName} />
      </header>

      <SourceNavigation
        active={source?.id}
        ariaLabel="来源筛选"
        basePath={basePath}
        lineColor={line?.cssVar}
        sources={sources}
      />

      <div className="mt-6 min-w-0">{children}</div>
    </SiteShell>
  )
}
