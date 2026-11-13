'use client'

import { ArrowRight, Download, LayoutGrid, List, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Label,
  SearchField,
  Tab,
  TabList,
  TabPanel,
  Tabs
} from 'react-aria-components'
import { skillPath } from '../../../shared/skills'
import type { FeedResult, SkillFeeds } from '../lib/hot-feed'
import { parseSkillMetadata } from '../lib/skill-metadata'
import { searchSkillFeed } from '../lib/skill-search'
import { cn } from '../lib/utils'
import { EmptyFeed, FeedError } from './feed-state'

export { parseSkillMetadata } from '../lib/skill-metadata'

const countFormatter = new Intl.NumberFormat('en-US')

function SkillFeed({
  feed,
  view,
  trending,
  onClear
}: {
  feed: FeedResult
  view: string
  trending?: boolean
  onClear: () => void
}) {
  if (feed.state === 'empty') return <EmptyFeed />
  if (feed.state === 'error') return <FeedError />
  if (!feed.items.length)
    return (
      <div className="rounded-sm border border-border bg-card py-12 text-center">
        <p className="text-sm text-muted-foreground">未找到匹配的 Skill</p>
        <Button
          onPress={onClear}
          className="mt-3 min-h-10 cursor-pointer px-3 text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          清除筛选
        </Button>
      </div>
    )

  return (
    <ol
      className={
        view === 'cards'
          ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
          : 'divide-y divide-border rounded-sm border border-border bg-card'
      }
    >
      {feed.items.map((item) => {
        const metadata = parseSkillMetadata(item.summary)
        const name = item.title.replace(/^#\d+\s+/, '')
        const href = skillPath(item.sourceKey) ?? item.url
        return (
          <li
            className={cn(
              'grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 transition-colors hover:bg-row-highlight',
              view === 'cards'
                ? 'rounded-sm border border-border bg-card p-5'
                : 'px-4 py-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5 sm:px-5 sm:py-5'
            )}
            key={item.sourceKey}
          >
            <span aria-hidden="true" className="rank-numeral pt-0.5" data-rank={item.position}>
              {String(item.position).padStart(2, '0')}
            </span>
            <article className="min-w-0">
              <Link
                className="group block text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                href={href}
              >
                <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-6 transition-colors group-hover:text-primary">
                  <span className="min-w-0 wrap-anywhere">{name}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </span>
                {metadata.description ? (
                  <span className="mt-1.5 line-clamp-2 block text-sm font-normal leading-6 text-muted-foreground">
                    {metadata.description}
                  </span>
                ) : null}
                <span className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground">
                  {metadata.installs !== null ? (
                    <span
                      className="inline-flex items-center gap-1"
                      title={trending ? '近 24 小时安装' : '累计安装'}
                    >
                      <Download aria-hidden="true" className="size-3.5" />
                      {countFormatter.format(metadata.installs)}
                      <span>{trending ? '24h' : '总计'}</span>
                    </span>
                  ) : null}
                </span>
              </Link>
              {metadata.source && (
                <a
                  className="mt-2 block truncate font-mono text-xs text-muted-foreground hover:text-primary"
                  href={
                    metadata.source.includes('/')
                      ? `https://github.com/${metadata.source}`
                      : `https://${metadata.source}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  data-outbound
                >
                  {metadata.source} ↗
                </a>
              )}
            </article>
          </li>
        )
      })}
    </ol>
  )
}

export function SkillLeaderboard({ feeds }: { feeds: SkillFeeds }) {
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('all-time')
  const [query, setQuery] = useState('')
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('skills-view') ?? '{}')
      if (['list', 'cards'].includes(saved.view)) setView(saved.view)
      if (['all-time', 'trending'].includes(saved.tab)) setTab(saved.tab)
      if (typeof saved.query === 'string') setQuery(saved.query)
    } catch {
      /* Browser storage is optional. */
    }
  }, [])
  function remember(nextView: string, nextTab: string, nextQuery = query) {
    setView(nextView)
    setTab(nextTab)
    setQuery(nextQuery)
    try {
      sessionStorage.setItem(
        'skills-view',
        JSON.stringify({ view: nextView, tab: nextTab, query: nextQuery })
      )
    } catch {
      /* Browser storage is optional. */
    }
  }
  const activeFeed = feeds[tab === 'trending' ? 'skills-trending' : 'skills-all-time']
  const popularFeed = searchSkillFeed(feeds['skills-all-time'], query)
  const trendingFeed = searchSkillFeed(feeds['skills-trending'], query)
  const filteredFeed = tab === 'trending' ? trendingFeed : popularFeed
  const clearSearch = () => remember(view, tab, '')
  return (
    <Tabs selectedKey={tab} onSelectionChange={(key) => remember(view, String(key))}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => remember(view, tab, value)}
          className="max-w-lg flex-1"
        >
          <Label className="sr-only">搜索 Skills</Label>
          <div className="flex min-h-10 items-center gap-2.5 rounded-sm border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="筛选名称或仓库…"
              maxLength={200}
              className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <Button
                aria-label="清除搜索"
                onPress={clearSearch}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
        </SearchField>

        <fieldset className="flex items-center gap-1.5 self-end sm:self-auto" aria-label="视图">
          {[
            ['list', '列表', List],
            ['cards', '卡片', LayoutGrid]
          ].map(([key, label, Icon]) => {
            const ViewIcon = Icon as typeof List
            return (
              <Button
                key={String(key)}
                aria-pressed={view === key}
                onPress={() => remember(String(key), tab)}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-card px-3 text-xs outline-none hover:border-strong focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/60 aria-pressed:bg-accent aria-pressed:font-semibold"
              >
                <ViewIcon aria-hidden="true" className="size-3.5" />
                {String(label)}
              </Button>
            )
          })}
        </fieldset>
      </div>

      <TabList
        aria-label="Skills 排行"
        className="mb-5 flex w-full overflow-x-auto overflow-y-hidden border-b border-border slim-scrollbar"
      >
        <Tab
          id="all-time"
          className="min-h-10 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 pl-0 font-mono text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          总榜
        </Tab>
        <Tab
          id="trending"
          className="min-h-10 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 font-mono text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          上升最快
        </Tab>
      </TabList>
      {activeFeed.state === 'ready' && (
        <p role="status" className="mb-4 font-mono text-xs tabular-nums text-muted-foreground">
          {query.trim() && filteredFeed.state === 'ready'
            ? `${filteredFeed.items.length} / ${activeFeed.items.length} 条`
            : `${activeFeed.items.length} 条`}{' '}
          ·{' '}
          {new Intl.DateTimeFormat('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
            timeZone: 'Asia/Shanghai'
          }).format(activeFeed.status.lastSuccessAt)}
        </p>
      )}
      <TabPanel id="all-time" className="outline-none">
        <SkillFeed view={view} feed={popularFeed} onClear={clearSearch} />
      </TabPanel>
      <TabPanel id="trending" className="outline-none">
        <SkillFeed view={view} trending feed={trendingFeed} onClear={clearSearch} />
      </TabPanel>
    </Tabs>
  )
}
