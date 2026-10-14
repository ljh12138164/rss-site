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
import { searchSkillFeed } from '../lib/skill-search'
import { cn } from '../lib/utils'
import { EmptyFeed, FeedError } from './feed-state'

const countFormatter = new Intl.NumberFormat('en-US')

import { parseSkillMetadata } from '../lib/skill-metadata'

export { parseSkillMetadata } from '../lib/skill-metadata'

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
      <div className="border-y border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">没有匹配的 Skill</p>
        <Button
          onPress={onClear}
          className="mt-3 min-h-11 px-3 text-sm text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          清除搜索
        </Button>
      </div>
    )

  return (
    <ol
      className={
        view === 'cards' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'border-y border-border'
      }
    >
      {feed.items.map((item) => {
        const metadata = parseSkillMetadata(item.summary)
        const name = item.title.replace(/^#\d+\s+/, '')
        const href = skillPath(item.sourceKey) ?? item.url
        return (
          <li
            className={cn(
              'grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-md hover:bg-row-highlight',
              view === 'cards'
                ? 'border border-border p-5'
                : 'border-b border-border/80 px-2.5 py-5 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5 sm:py-6'
            )}
            key={item.sourceKey}
          >
            <span aria-hidden="true" className="rank-numeral pt-1" data-rank={item.position}>
              {String(item.position).padStart(2, '0')}
            </span>
            <article className="min-w-0">
              <Link className="group block text-foreground" href={href}>
                <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-7 tracking-[-0.01em] transition-colors group-hover:text-primary sm:text-[1.0625rem]">
                  <span className="min-w-0 wrap-anywhere">{name}</span>
                  <ArrowRight
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
                    <span
                      className="inline-flex items-center gap-1 tabular-nums"
                      title={trending ? '近 24 小时安装' : '累计安装'}
                    >
                      <Download aria-hidden="true" className="size-3.5" />
                      {countFormatter.format(metadata.installs)}
                      <span>{trending ? '近 24 小时' : '累计安装'}</span>
                    </span>
                  ) : null}
                </span>
              </Link>
              {metadata.source && (
                <a
                  className="mt-3 block truncate font-mono text-xs text-muted-foreground hover:text-primary"
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
      <SearchField value={query} onChange={(value) => remember(view, tab, value)} className="mb-5">
        <Label className="sr-only">搜索当前榜单的 Skills</Label>
        <div className="flex min-h-11 items-center gap-3 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="搜索名称、用途或来源"
            maxLength={200}
            className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <Button
              aria-label="清除搜索"
              onPress={clearSearch}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      </SearchField>
      <fieldset className="mb-4 flex justify-end gap-2" aria-label="榜单视图">
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
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted"
            >
              <ViewIcon aria-hidden="true" className="size-4" />
              {String(label)}
            </Button>
          )
        })}
      </fieldset>
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
      {activeFeed.state === 'ready' && (
        <p role="status" className="mb-5 text-xs text-muted-foreground tabular-nums">
          {query.trim() && filteredFeed.state === 'ready'
            ? `匹配 ${filteredFeed.items.length} / ${activeFeed.items.length} 条`
            : `${activeFeed.items.length} 条`}{' '}
          · 更新于{' '}
          {new Intl.DateTimeFormat('zh-CN', {
            dateStyle: 'medium',
            timeStyle: 'short',
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
