'use client'

import { Calendar, ChevronDown, ChevronRight, Coins, Cpu, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { EvidenceSection, ModelDetail } from '../../lib/leaderboard'
import { FormattedDate } from '../site-language'
import { LEADERBOARD_DOMAIN_KEYS } from './model-leaderboard'

interface ModelDetailViewProps {
  detail: ModelDetail
}

function SectionAccordion({
  section,
  isOpenDefault = true
}: {
  section: EvidenceSection
  isOpenDefault?: boolean
}) {
  const t = useTranslations('leaderboard')
  const [isOpen, setIsOpen] = useState(isOpenDefault)
  const domainKey = LEADERBOARD_DOMAIN_KEYS[section.domain as keyof typeof LEADERBOARD_DOMAIN_KEYS]

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-row-highlight focus-visible:outline-2 focus-visible:outline-ring sm:px-5"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-sm border border-border bg-background text-primary">
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </span>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-base font-semibold text-foreground">
              {domainKey ? t(domainKey) : section.domain}
            </span>
            {section.score && (
              <span className="font-mono text-sm font-bold tabular-nums text-primary">
                {section.score} {t('pointsUnit')}
              </span>
            )}
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {section.benchmarks.length} {t('benchmarksUnit')}
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="divide-y divide-border/70 border-t border-border">
          {section.benchmarks.map((bm) => (
            <div
              key={`${bm.name}-${bm.evaluator}`}
              className="flex flex-col justify-between gap-2.5 px-4 py-3.5 transition-colors hover:bg-row-highlight sm:flex-row sm:items-center sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {bm.url ? (
                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                    >
                      <span className="truncate">{bm.name}</span>
                      <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{bm.name}</span>
                  )}
                  <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {bm.evaluator}
                  </span>
                  {bm.config && (
                    <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {bm.config}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 self-end font-mono text-xs tabular-nums sm:self-auto">
                <div>
                  <span className="text-muted-foreground">{t('rawScore')} </span>
                  <strong className="font-semibold text-foreground">{bm.rawScore}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('normalizedScore')} </span>
                  <strong className="font-bold text-primary">{bm.capabilityScore}</strong>
                </div>
                {bm.rank && (
                  <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-muted-foreground">
                    {bm.rank}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ModelDetailView({ detail }: ModelDetailViewProps) {
  const t = useTranslations('leaderboard')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')
  return (
    <div className="space-y-8">
      <nav
        aria-label={tCommon('breadcrumb')}
        className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          {tCommon('allStories')}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/leaderboard" className="transition-colors hover:text-primary">
          {tNav('modelBenchmarks')}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-foreground">
          {detail.name}
        </span>
      </nav>

      <header className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-sm bg-primary px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-primary-foreground">
                No.{detail.rank}
              </span>
              <span className="font-mono text-xs font-medium text-foreground">
                {detail.creator}
              </span>
              {detail.releasedAt && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  <FormattedDate
                    date={detail.releasedAt}
                    options={{ year: 'numeric', month: '2-digit', day: '2-digit' }}
                  />
                </span>
              )}
            </div>

            <h1 className="headline-display mt-3 text-2xl text-foreground sm:text-4xl">
              {detail.name}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-sm border border-border bg-background px-4 py-3">
            <div className="text-right">
              <p className="font-mono text-[11px] text-muted-foreground">{t('overallScore')}</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                {detail.overallScore}
              </p>
            </div>
            <div className="h-9 w-px bg-border" />
            <div className="font-mono text-xs">
              <p className="text-muted-foreground">{t('rankLabel')}</p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {t('rankValue', { rank: detail.rank })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 font-mono text-xs tabular-nums text-muted-foreground">
          {detail.pricing?.input || detail.pricing?.output ? (
            <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-1 text-foreground">
              <Coins className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span>
                {t('priceInput')}
                {detail.pricing.input || '-'} {t('priceOutput')}
                {detail.pricing.output || '-'}
                {detail.pricing.cached && (
                  <> {t('priceCached', { price: detail.pricing.cached })}</>
                )}
                <span className="text-muted-foreground"> {t('pricePerMillion')}</span>
              </span>
            </div>
          ) : (
            <span>{t('noPricing')}</span>
          )}

          {detail.coverage && (
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="size-3.5" aria-hidden="true" />
              {t('coverageDetail', {
                count: detail.coverage.count,
                percentage: detail.coverage.percentage
              })}
            </span>
          )}
        </div>
      </header>

      {Object.keys(detail.scores).length > 0 && (
        <section aria-labelledby="subscores-heading" className="space-y-3">
          <h2 id="subscores-heading" className="text-base font-semibold text-foreground">
            {t('categoryScores')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(detail.scores).map(([domain, info]) => {
              const domainKey =
                LEADERBOARD_DOMAIN_KEYS[domain as keyof typeof LEADERBOARD_DOMAIN_KEYS]
              return (
                <div key={domain} className="rounded-sm border border-border bg-card p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {domainKey ? t(domainKey) : domain}
                    </span>
                    {info.rank && (
                      <span className="font-mono font-semibold tabular-nums text-primary">
                        {info.rank}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-foreground">
                    {info.score}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {t('pointsUnit')}
                    </span>
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="evidence-heading" className="space-y-4">
        <h2 id="evidence-heading" className="text-base font-semibold text-foreground">
          {t('benchmarkResults')}
        </h2>
        <div className="space-y-3">
          {detail.evidenceSections.map((section) => (
            <SectionAccordion key={section.domain} section={section} />
          ))}
        </div>
      </section>

      {detail.unmeasuredBenchmarks.length > 0 && (
        <section
          aria-labelledby="unmeasured-heading"
          className="rounded-sm border border-dashed border-border bg-card p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 id="unmeasured-heading">
              {t('untestedBenchmarks', { count: detail.unmeasuredBenchmarks.length })}
            </h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.unmeasuredBenchmarks.map((item) => (
              <span
                key={item}
                className="rounded-sm border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="rounded-sm border border-border bg-card p-4 text-xs leading-6 text-muted-foreground">
        {t('normalizedNote')}
      </footer>
    </div>
  )
}
