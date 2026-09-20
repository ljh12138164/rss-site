'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { RssSubscription } from './rss-subscription'
import { SiteShell } from './site-shell'
import { SourceNavigation } from './source-navigation'

export function SectionLayout({
  children,
  basePath,
  title,
  description,
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
  const source = sources.find((source) => source.id === segments[0])

  // Article details own their reading layout, outside the platform list shell.
  if (segments.length > 1 || (segments.length === 1 && !source)) return children

  return (
    <SiteShell>
      {source && (
        <nav aria-label="面包屑">
          <ol className="mb-8 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <li>
              <Link className="min-h-11 py-3 transition-colors hover:text-primary" href="/">
                首页
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="min-h-11 py-3 transition-colors hover:text-primary" href={basePath}>
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
      <header className="pb-8 sm:pb-10">
        <p className="eyebrow">{sectionName} · Section</p>
        <h1 className="headline-display mt-3 text-4xl leading-[1.1] sm:text-5xl">
          {source?.name ?? title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          {source?.description ?? description}
        </p>
        <RssSubscription key={basePath} basePath={basePath} sectionName={sectionName} />
      </header>
      <SourceNavigation
        active={source?.id}
        ariaLabel="内容来源"
        basePath={basePath}
        sources={sources}
      />
      <div className="mt-10 min-w-0">{children}</div>
    </SiteShell>
  )
}
