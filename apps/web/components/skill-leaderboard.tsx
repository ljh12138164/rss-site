'use client'

import { ArrowUpRight, Download } from 'lucide-react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import type { FeedResult, SkillFeeds } from '../lib/hot-feed'
import { EmptyFeed, FeedError } from './feed-state'

const countFormatter = new Intl.NumberFormat('en-US')

interface SkillMetadata {
  description: string | null
  installs: number | null
  source: string | null
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value.replace(/[,+]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function parseSkillMetadata(summary: string | null): SkillMetadata {
  if (!summary) return { description: null, installs: null, source: null }
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
    source: metadata.get('Source') ?? null
  }
}

function SkillFeed({ feed }: { feed: FeedResult }) {
  if (feed.state === 'empty') return <EmptyFeed />
  if (feed.state === 'error') return <FeedError />

  return (
    <ol className="border-y border-border">
      {feed.items.map((item) => {
        const metadata = parseSkillMetadata(item.summary)
        const name = item.title.replace(/^#\d+\s+/, '')
        const href = item.url
        return (
          <li
            className="-mx-2 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-md border-b border-border/80 px-2.5 py-5 transition-colors duration-150 last:border-b-0 hover:bg-row-highlight sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5 sm:py-6"
            key={item.sourceKey}
          >
            <span aria-hidden="true" className="rank-numeral pt-1" data-rank={item.position}>
              {String(item.position).padStart(2, '0')}
            </span>
            <article className="min-w-0">
              <a
                className="group block text-foreground"
                href={href}
                target="_blank"
                rel="noreferrer noopener external"
                data-outbound
              >
                <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-7 tracking-[-0.01em] transition-colors group-hover:text-primary sm:text-[1.0625rem]">
                  <span className="min-w-0 wrap-anywhere">{name}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                  />
                </span>
                {metadata.description ? (
                  <span className="mt-2 line-clamp-2 text-sm font-normal leading-6 text-muted-foreground">
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
                  {metadata.source ? <span className="truncate">{metadata.source}</span> : null}
                </span>
              </a>
            </article>
          </li>
        )
      })}
    </ol>
  )
}

export function SkillLeaderboard({ feeds }: { feeds: SkillFeeds }) {
  return (
    <Tabs defaultSelectedKey="all-time">
      <TabList
        aria-label="Skills 排行榜"
        className="mb-8 flex w-full border-b border-border sm:w-auto"
      >
        <Tab
          id="all-time"
          className="-mb-px min-h-11 cursor-pointer border-b-2 border-transparent px-4 pl-0 font-mono text-[0.8125rem] text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          最热门
        </Tab>
        <Tab
          id="trending"
          className="-mb-px min-h-11 cursor-pointer border-b-2 border-transparent px-4 font-mono text-[0.8125rem] text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          增长最快
        </Tab>
      </TabList>
      <TabPanel id="all-time" className="outline-none">
        <SkillFeed feed={feeds['skills-all-time']} />
      </TabPanel>
      <TabPanel id="trending" className="outline-none">
        <SkillFeed feed={feeds['skills-trending']} />
      </TabPanel>
    </Tabs>
  )
}
