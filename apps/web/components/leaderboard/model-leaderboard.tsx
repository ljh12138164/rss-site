'use client'

import { ArrowRight, Coins, Cpu, LayoutGrid, List, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
import {
  LEADERBOARD_CATEGORIES,
  type LeaderboardCategoryId,
  type ModelLeaderboardItem
} from '../../lib/leaderboard'
import { cn } from '../../lib/utils'

interface ModelLeaderboardProps {
  categories: Record<string, ModelLeaderboardItem[]>
}

function ModelItemCard({ item, view }: { item: ModelLeaderboardItem; view: 'list' | 'cards' }) {
  const isCards = view === 'cards'

  return (
    <li
      className={cn(
        'group rounded-lg transition-colors hover:bg-muted/40',
        isCards
          ? 'flex flex-col justify-between border border-border p-5 bg-card/60'
          : 'grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border/80 px-2.5 py-4 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5 sm:py-5'
      )}
    >
      <div className={cn('flex items-start', isCards ? 'justify-between mb-3' : '')}>
        <span
          aria-hidden="true"
          className="rank-numeral pt-0.5 text-lg font-bold sm:text-xl"
          data-rank={item.rank}
        >
          {String(item.rank).padStart(2, '0')}
        </span>
        {isCards && (
          <span className="inline-flex items-baseline gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold text-primary">
            <span className="text-xs font-normal text-muted-foreground">得分</span>
            {item.overallScore}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Link
            href={item.url}
            className="group/link inline-flex max-w-full items-center gap-1.5 text-base font-semibold leading-snug text-foreground transition-colors hover:text-primary sm:text-lg"
          >
            <span className="truncate">{item.name}</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover/link:translate-x-0.5 group-hover/link:text-primary"
            />
          </Link>
          {!isCards && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-primary sm:text-lg">
                {item.overallScore}{' '}
                <span className="text-xs font-normal text-muted-foreground">分</span>
              </span>
            </div>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{item.creator}</span>
          {item.releasedAt && (
            <span>
              {new Date(item.releasedAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit'
              })}
            </span>
          )}
          {item.coverage && (
            <span className="inline-flex items-center gap-1">
              <Cpu className="size-3" />
              {item.coverage.count} 项实测 ({item.coverage.percentage}%)
            </span>
          )}
        </div>

        {/* Sub-scores */}
        {Object.keys(item.scores).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(item.scores).map(([domain, info]) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 rounded border border-border/70 bg-muted/30 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                <span>{domain}</span>
                <strong className="text-foreground">{info.score}</strong>
                {info.rank && (
                  <span className="text-[10px] text-muted-foreground/75">({info.rank})</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Pricing info */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          {item.pricing?.input || item.pricing?.output ? (
            <span className="inline-flex items-center gap-1 tabular-nums text-foreground/80">
              <Coins className="size-3 text-muted-foreground" />
              输入 ¥{item.pricing.input || '-'} / 输出 ¥{item.pricing.output || '-'}
              <span className="text-[10px] text-muted-foreground">/百万Token</span>
            </span>
          ) : (
            <span className="text-muted-foreground/70">暂无官方按量价</span>
          )}
        </div>
      </div>
    </li>
  )
}

export function ModelLeaderboard({ categories }: ModelLeaderboardProps) {
  const [view, setView] = useState<'list' | 'cards'>('list')
  const [tab, setTab] = useState<LeaderboardCategoryId>('overall')
  const [query, setQuery] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('leaderboard-view') ?? '{}')
      if (['list', 'cards'].includes(saved.view)) setView(saved.view)
      if (LEADERBOARD_CATEGORIES.some((c) => c.id === saved.tab)) setTab(saved.tab)
      if (typeof saved.query === 'string') setQuery(saved.query)
    } catch {
      /* Browser storage optional */
    }
  }, [])

  function remember(nextView: 'list' | 'cards', nextTab: LeaderboardCategoryId, nextQuery = query) {
    setView(nextView)
    setTab(nextTab)
    setQuery(nextQuery)
    try {
      sessionStorage.setItem(
        'leaderboard-view',
        JSON.stringify({ view: nextView, tab: nextTab, query: nextQuery })
      )
    } catch {
      /* Browser storage optional */
    }
  }

  const rawList = categories[tab] || categories.overall || []

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rawList
    return rawList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.creator.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [rawList, query])

  const clearSearch = () => remember(view, tab, '')

  return (
    <Tabs
      selectedKey={tab}
      onSelectionChange={(key) => remember(view, key as LeaderboardCategoryId)}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(val) => remember(view, tab, val)}
          className="flex-1 max-w-lg"
        >
          <Label className="sr-only">搜索大模型</Label>
          <div className="flex min-h-11 items-center gap-2.5 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="搜索模型名或机构（如 Gemini、DeepSeek、Claude）"
              maxLength={100}
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <Button
                aria-label="清除搜索"
                onPress={clearSearch}
                className="flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
        </SearchField>

        <fieldset className="flex items-center gap-1.5 self-end sm:self-auto" aria-label="展示视图">
          <Button
            aria-pressed={view === 'list'}
            onPress={() => remember('list', tab)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border/80 px-3 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:font-semibold"
          >
            <List className="size-3.5" />
            列表
          </Button>
          <Button
            aria-pressed={view === 'cards'}
            onPress={() => remember('cards', tab)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border/80 px-3 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:font-semibold"
          >
            <LayoutGrid className="size-3.5" />
            卡片
          </Button>
        </fieldset>
      </div>

      <TabList
        aria-label="评测分类维度"
        className="mb-6 flex w-full border-b border-border overflow-x-auto slim-scrollbar"
      >
        {LEADERBOARD_CATEGORIES.map((cat, idx) => (
          <Tab
            key={cat.id}
            id={cat.id}
            className={cn(
              '-mb-px min-h-11 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 font-mono text-[0.8125rem] text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary',
              idx === 0 && 'pl-0'
            )}
          >
            {cat.label}
          </Tab>
        ))}
      </TabList>

      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {query.trim()
            ? `匹配 ${filteredList.length} / ${rawList.length} 款模型`
            : `共 ${rawList.length} 款模型`}
          {' · '}4 小时更新
        </span>
      </div>

      {LEADERBOARD_CATEGORIES.map((cat) => (
        <TabPanel key={cat.id} id={cat.id} className="outline-none">
          {filteredList.length === 0 ? (
            <div className="border-y border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">未检索到匹配的模型</p>
              {query && (
                <Button
                  onPress={clearSearch}
                  className="mt-3 min-h-10 rounded px-3 text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  清除过滤条件
                </Button>
              )}
            </div>
          ) : (
            <ol
              className={
                view === 'cards'
                  ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
                  : 'border-y border-border'
              }
            >
              {filteredList.map((item) => (
                <ModelItemCard key={item.slug} item={item} view={view} />
              ))}
            </ol>
          )}
        </TabPanel>
      ))}
    </Tabs>
  )
}
