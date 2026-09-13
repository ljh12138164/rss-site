'use client'

import { ArrowUpRight, Download, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import type { FeedResult, SkillFeeds } from '../lib/hot-feed'
import { EmptyFeed, FeedError } from './feed-state'

const countFormatter = new Intl.NumberFormat('en-US')

interface SkillMetadata {
  description: string | null
  installs: number | null
  change: number | null
  source: string | null
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value.replace(/[,+]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function parseSkillMetadata(summary: string | null): SkillMetadata {
  if (!summary) return { description: null, installs: null, change: null, source: null }
  const parts = summary.split(' · ')
  const metadata = new Map(
    parts.slice(1).flatMap((part) => {
      const separator = part.indexOf(':')
      return separator < 0 ? [] : [[part.slice(0, separator), part.slice(separator + 1).trim()]]
    })
  )
  return {
    description: parts[0] || null,
    installs: parseNumber(metadata.get('Installs')),
    change: parseNumber(metadata.get('Hourly change')),
    source: metadata.get('Source') ?? null
  }
}

function SkillFeed({ feed, growing }: { feed: FeedResult; growing: boolean }) {
  if (feed.state === 'empty') return <EmptyFeed />
  if (feed.state === 'error') return <FeedError />

  return (
    <ol className="divide-y divide-border border-y border-border">
      {feed.items.map((item) => {
        const metadata = parseSkillMetadata(item.summary)
        const name = item.title.replace(/^#\d+\s+/, '')
        const href = `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent('/skills')}`
        return (
          <li
            className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5"
            key={item.sourceKey}
          >
            <span className="pt-0.5 font-mono text-sm font-semibold tabular-nums text-primary">
              {String(item.position).padStart(2, '0')}
            </span>
            <article className="min-w-0">
              <Link className="group block text-foreground" href={href}>
                <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-7 tracking-[-0.01em] transition-colors group-hover:text-primary sm:text-lg">
                  <span className="min-w-0 wrap-anywhere">{name}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  />
                </span>
                {metadata.description ? (
                  <span className="mt-2 line-clamp-3 text-sm font-normal leading-6 text-muted-foreground">
                    {metadata.description}
                  </span>
                ) : null}
                <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
                  {metadata.installs !== null ? (
                    <span className="inline-flex items-center gap-1 tabular-nums" title="安装量">
                      <Download aria-hidden="true" className="size-3.5" />
                      {countFormatter.format(metadata.installs)}
                    </span>
                  ) : null}
                  {growing && metadata.change !== null ? (
                    <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                      <TrendingUp aria-hidden="true" className="size-3.5" />
                      {metadata.change >= 0 ? '+' : ''}
                      {countFormatter.format(metadata.change)}
                    </span>
                  ) : null}
                  {metadata.source ? <span className="truncate">{metadata.source}</span> : null}
                </span>
              </Link>
            </article>
          </li>
        )
      })}
    </ol>
  )
}

export function SkillLeaderboard({ feeds }: { feeds: SkillFeeds }) {
  return (
    <Tabs defaultSelectedKey="trending">
      <TabList
        aria-label="Skills 排行榜"
        className="mb-6 flex w-full border-b border-border sm:w-auto"
      >
        <Tab
          id="trending"
          className="-mb-px min-h-11 cursor-pointer border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:text-primary"
        >
          最热门
        </Tab>
        <Tab
          id="hot"
          className="-mb-px min-h-11 cursor-pointer border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:text-primary"
        >
          增长最快
        </Tab>
      </TabList>
      <TabPanel id="trending" className="outline-none">
        <SkillFeed feed={feeds['skills-trending']} growing={false} />
      </TabPanel>
      <TabPanel id="hot" className="outline-none">
        <SkillFeed feed={feeds['skills-hot']} growing />
      </TabPanel>
    </Tabs>
  )
}
