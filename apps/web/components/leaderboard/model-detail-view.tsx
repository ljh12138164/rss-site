'use client'

import { Calendar, ChevronDown, ChevronRight, Coins, Cpu, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { EvidenceSection, ModelDetail } from '../../lib/leaderboard'

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
  const [isOpen, setIsOpen] = useState(isOpenDefault)

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </span>
          <div>
            <span className="font-semibold text-foreground text-base sm:text-lg">
              {section.domain}
            </span>
            {section.score && (
              <span className="ml-2.5 font-mono text-base font-bold text-primary">
                {section.score}{' '}
                <span className="text-xs font-normal text-muted-foreground">分</span>
              </span>
            )}
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {section.benchmarks.length} 项实测
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/70 p-3 sm:p-5">
          <div className="space-y-2.5">
            {section.benchmarks.map((bm) => (
              <div
                key={`${bm.name}-${bm.evaluator}`}
                className="flex flex-col justify-between gap-3 rounded-lg border border-border/60 bg-background/50 p-3.5 transition-colors hover:border-border hover:bg-muted/30 sm:flex-row sm:items-center sm:p-4"
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
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {bm.evaluator}
                    </span>
                    {bm.config && (
                      <span className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {bm.config}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4 self-end font-mono text-sm sm:self-auto">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">原始值 </span>
                    <strong className="text-sky-600 dark:text-sky-400 font-semibold">
                      {bm.rawScore}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">折算能力分 </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {bm.capabilityScore}
                    </strong>
                  </div>
                  {bm.rank && (
                    <span className="rounded bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                      {bm.rank}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ModelDetailView({ detail }: ModelDetailViewProps) {
  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav
        aria-label="面包屑"
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          首页
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/leaderboard" className="transition-colors hover:text-primary">
          AI 模型榜
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-foreground">
          {detail.name}
        </span>
      </nav>

      {/* Model Header */}
      <header className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md bg-primary px-2.5 py-1 font-mono text-xs font-bold text-primary-foreground">
                No.{detail.rank}
              </span>
              <span className="font-mono text-sm font-medium text-muted-foreground">
                {detail.creator}
              </span>
              {detail.releasedAt && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {new Date(detail.releasedAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {detail.name}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              前沿大模型能力评测成绩与细分基准证据链。
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-xl border border-border/70 bg-background/60 p-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">综合评测得分</p>
              <p className="font-mono text-3xl font-black text-primary sm:text-4xl">
                {detail.overallScore}
              </p>
            </div>
            <div className="h-10 w-px bg-border/70" />
            <div className="text-left font-mono text-xs text-muted-foreground">
              <p>综合排位</p>
              <p className="text-base font-bold text-foreground">第 {detail.rank} 名</p>
            </div>
          </div>
        </div>

        {/* Pricing & Coverage Strip */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border/60 pt-5 font-mono text-xs text-muted-foreground">
          {detail.pricing?.input || detail.pricing?.output ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-foreground/80">
              <Coins className="size-4 text-muted-foreground" />
              <span>
                API 参考定价: 输入 ¥{detail.pricing.input || '-'} / 输出 ¥
                {detail.pricing.output || '-'}
                {detail.pricing.cached && ` (缓存 ¥${detail.pricing.cached})`}
                <span className="text-[10px] text-muted-foreground"> / 每百万 Token</span>
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-muted-foreground/75">
              <Coins className="size-3.5" />
              <span>暂无官方按量价格</span>
            </div>
          )}

          {detail.coverage && (
            <div className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Cpu className="size-3.5" />
              <span>
                已评测 {detail.coverage.count} 项基准 · 覆盖率 {detail.coverage.percentage}%
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Domain Sub-scores Overview */}
      {Object.keys(detail.scores).length > 0 && (
        <section aria-labelledby="subscores-heading" className="space-y-4">
          <h2 id="subscores-heading" className="text-xl font-bold tracking-tight text-foreground">
            五大领域分项成绩
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(detail.scores).map(([domain, info]) => (
              <div
                key={domain}
                className="rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:border-border"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{domain}</span>
                  {info.rank && (
                    <span className="font-mono text-primary font-semibold">{info.rank}</span>
                  )}
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-foreground">
                  {info.score} <span className="text-xs font-normal text-muted-foreground">分</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evidence Chain Sections */}
      <section aria-labelledby="evidence-heading" className="space-y-5">
        <div>
          <h2 id="evidence-heading" className="text-xl font-bold tracking-tight text-foreground">
            实测证据链明细
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            每一项成绩都有明确来处。列出标准化评测集原始成绩及其统一折算分。
          </p>
        </div>

        <div className="space-y-4">
          {detail.evidenceSections.map((section) => (
            <SectionAccordion key={section.domain} section={section} />
          ))}
        </div>
      </section>

      {/* Unmeasured Benchmarks */}
      {detail.unmeasuredBenchmarks.length > 0 && (
        <section
          aria-labelledby="unmeasured-heading"
          className="rounded-xl border border-dashed border-border/80 p-5 sm:p-6"
        >
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 size-4 text-muted-foreground shrink-0" />
            <div>
              <h3
                id="unmeasured-heading"
                className="font-semibold text-foreground text-sm sm:text-base"
              >
                尚未成效的评测项（{detail.unmeasuredBenchmarks.length} 项）
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                该模型目前在以下公开测试集暂无官方或独立第三方实测成绩，不参与赋分：
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {detail.unmeasuredBenchmarks.map((item) => (
              <span
                key={item}
                className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 font-mono text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* How scores work explanation */}
      <footer className="rounded-xl bg-muted/30 p-5 text-xs text-muted-foreground leading-relaxed">
        <h4 className="font-semibold text-foreground mb-1">能力折算分说明</h4>
        <p>
          不同公开测试集的绝对分值与满分标尺各不相同（如百分比、Elo 分或通过率）。
          折算分基于该评测历史难度与全部参评模型得分分布换算为统一标准分，便于跨评测直观横向比对。
        </p>
      </footer>
    </div>
  )
}
