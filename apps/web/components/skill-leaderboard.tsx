'use client'

import { ArrowRight, ArrowUpRight, Download, LayoutGrid, List, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
import { EmptyFeed, FeedError } from './feed-state'
import { FormattedDate } from './site-language'
import { UiSegmentedGroup } from './ui/segmented-group'

export { parseSkillMetadata } from '../lib/skill-metadata'

const countFormatter = new Intl.NumberFormat('en-US')

function SkillInstalls({ installs, trending }: { installs: number | null; trending?: boolean }) {
  const t = useTranslations('skills')
  if (installs === null) return null
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap"
      title={trending ? t('recentInstalls') : t('totalInstalls')}
    >
      <Download aria-hidden="true" className="size-3.5" />
      <span>{countFormatter.format(installs)}</span>
      <span>{trending ? '24h' : t('totalLabel')}</span>
    </span>
  )
}

function SkillSourceLink({ source }: { source: string | null }) {
  if (!source) return null
  return (
    <a
      className="inline-flex min-w-0 max-w-full items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      href={source.includes('/') ? `https://github.com/${source}` : `https://${source}`}
      target="_blank"
      rel="noopener noreferrer"
      data-outbound
      title={source}
    >
      <span className="truncate">{source}</span>
      <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
    </a>
  )
}

function SkillTitle({ name }: { name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-base font-semibold leading-6 transition-colors group-hover:text-primary">
      <span className="min-w-0 truncate" title={name}>
        {name}
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </span>
  )
}

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
  const t = useTranslations('skills')
  const tCommon = useTranslations('common')
  if (feed.state === 'empty') return <EmptyFeed />
  if (feed.state === 'error') return <FeedError />
  if (!feed.items.length)
    return (
      <div className="rounded-sm border border-border bg-card py-12 text-center">
        <p className="text-sm text-muted-foreground">{t('noMatches')}</p>
        <Button
          onPress={onClear}
          className="mt-3 min-h-10 cursor-pointer px-3 text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {tCommon('clearFilters')}
        </Button>
      </div>
    )

  const isCards = view === 'cards'

  return (
    <ol
      className={
        isCards
          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
          : 'divide-y divide-border rounded-sm border border-border bg-card'
      }
    >
      {feed.items.map((item) => {
        const metadata = parseSkillMetadata(item.summary)
        const name = item.title.replace(/^#\d+\s+/, '')
        const href = skillPath(item.sourceKey) ?? item.url
        const rankLabel = String(item.position).padStart(2, '0')
        const hasMeta = metadata.installs !== null || Boolean(metadata.source)

        if (isCards) {
          return (
            <li
              className="h-[12rem] min-w-0 rounded-sm border border-border bg-card p-5 transition-colors hover:bg-row-highlight"
              key={item.sourceKey}
            >
              <article className="flex h-full min-w-0 flex-col">
                <Link
                  className="group flex min-h-0 flex-1 flex-col text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  href={href}
                >
                  <span className="flex min-h-7 w-full min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="rank-numeral shrink-0 leading-none"
                      data-rank={item.position}
                    >
                      {rankLabel}
                    </span>
                    <span className="min-w-0 flex-1">
                      <SkillTitle name={name} />
                    </span>
                  </span>
                  {metadata.description ? (
                    <span className="mt-2.5 line-clamp-3 wrap-anywhere text-sm font-normal leading-5 text-muted-foreground">
                      {metadata.description}
                    </span>
                  ) : null}
                </Link>
                {hasMeta ? (
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3 font-mono text-xs tabular-nums text-muted-foreground">
                    {metadata.installs !== null ? (
                      <SkillInstalls installs={metadata.installs} trending={trending} />
                    ) : (
                      <span />
                    )}
                    <SkillSourceLink source={metadata.source} />
                  </div>
                ) : null}
              </article>
            </li>
          )
        }

        return (
          <li
            className="h-32 px-4 py-3.5 transition-colors hover:bg-row-highlight sm:h-[6.25rem] sm:px-5 sm:py-4"
            key={item.sourceKey}
          >
            <article className="grid h-full min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 sm:grid-cols-[3rem_minmax(0,1fr)_13rem] sm:grid-rows-1 sm:gap-x-5 sm:gap-y-0 md:grid-cols-[3rem_minmax(0,1fr)_15rem]">
              <span aria-hidden="true" className="rank-numeral leading-6" data-rank={item.position}>
                {rankLabel}
              </span>
              <Link
                className="group min-w-0 self-start text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                href={href}
              >
                <SkillTitle name={name} />
                {metadata.description ? (
                  <span className="mt-1 line-clamp-2 wrap-anywhere text-sm font-normal leading-5 text-muted-foreground">
                    {metadata.description}
                  </span>
                ) : null}
              </Link>
              {hasMeta ? (
                <div className="col-start-2 flex items-center justify-between gap-3 self-end font-mono text-xs tabular-nums text-muted-foreground sm:col-start-3 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5 sm:self-center sm:text-right">
                  {metadata.installs !== null ? (
                    <SkillInstalls installs={metadata.installs} trending={trending} />
                  ) : (
                    <span className="sm:hidden" />
                  )}
                  <SkillSourceLink source={metadata.source} />
                </div>
              ) : null}
            </article>
          </li>
        )
      })}
    </ol>
  )
}

export function SkillLeaderboard({ feeds }: { feeds: SkillFeeds }) {
  const t = useTranslations('skills')
  const tCommon = useTranslations('common')
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
          <Label className="sr-only">{t('searchLabel')}</Label>
          <div className="flex min-h-10 items-center gap-2.5 rounded-sm border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              maxLength={200}
              className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <Button
                aria-label={tCommon('clearSearch')}
                onPress={clearSearch}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
        </SearchField>

        <UiSegmentedGroup
          ariaLabel={tCommon('view')}
          value={view === 'cards' ? 'cards' : 'list'}
          onChange={(next) => remember(next, tab)}
          className="self-end sm:self-auto"
          options={[
            {
              value: 'list',
              label: tCommon('list'),
              icon: <List aria-hidden="true" className="size-3.5" />
            },
            {
              value: 'cards',
              label: tCommon('cards'),
              icon: <LayoutGrid aria-hidden="true" className="size-3.5" />
            }
          ]}
        />
      </div>

      <TabList
        aria-label={t('rankingsAria')}
        className="mb-5 flex w-full overflow-x-auto overflow-y-hidden border-b border-border slim-scrollbar"
      >
        <Tab
          id="all-time"
          className="min-h-10 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 pl-0 font-mono text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          {t('tabAllTime')}
        </Tab>
        <Tab
          id="trending"
          className="min-h-10 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 font-mono text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          {t('tabTrending')}
        </Tab>
      </TabList>
      {activeFeed.state === 'ready' && (
        <p role="status" className="mb-4 font-mono text-xs tabular-nums text-muted-foreground">
          {query.trim() && filteredFeed.state === 'ready'
            ? t('shownOfTotal', {
                shown: filteredFeed.items.length,
                total: activeFeed.items.length
              })
            : t('totalResults', { count: activeFeed.items.length })}{' '}
          ·{' '}
          <FormattedDate
            date={activeFeed.status.lastSuccessAt}
            options={{
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hourCycle: 'h23',
              timeZone: 'Asia/Shanghai'
            }}
          />
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
