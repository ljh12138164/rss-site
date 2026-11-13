'use client'

import { listSignalSections, type SignalSourceId } from '@rss-site/signals'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components'
import { ActionButton } from '../../components/action-button'
import { HomeArticleList } from '../../components/home-article-list'
import { SiteShell } from '../../components/site-shell'
import { SourceIcon } from '../../components/source-icon'
import { UiCheckbox } from '../../components/ui/checkbox'
import {
  type FollowingPreferences,
  followingSources,
  saveFollowing,
  useFollowing
} from '../../lib/following'
import { cn } from '../../lib/utils'

const followingSections = listSignalSections().filter((section) =>
  followingSources.some((source) => source.section === section.id)
)

export default function FollowingPage() {
  const preferences = useFollowing()
  const [showAll, setShowAll] = useState(false)
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const isManageOpen = userExpanded ?? !preferences.followed.length
  const selected = followingSources
    .filter(
      (source) =>
        !preferences.hidden.includes(source.id) &&
        (showAll || preferences.followed.includes(source.id))
    )
    .map((source) => source.id)

  function save(next: FollowingPreferences) {
    setError(saveFollowing(next) ? '' : '无法保存偏好，请检查浏览器是否允许本地存储。')
  }

  function changeSource(id: SignalSourceId, state: 'followed' | 'hidden') {
    const active = preferences[state].includes(id)
    save({
      ...preferences,
      followed: preferences.followed.filter((value) => value !== id),
      hidden: preferences.hidden.filter((value) => value !== id),
      [state]: active
        ? preferences[state].filter((value) => value !== id)
        : [...preferences[state], id]
    })
  }

  return (
    <SiteShell>
      <header className="border-b border-border pb-6">
        <h1 className="headline-display text-balance text-3xl sm:text-4xl">我的关注</h1>
        <p className="mt-2.5 text-pretty text-sm leading-6 text-muted-foreground">
          关注或隐藏平台来源，配置保存在本地浏览器。
        </p>
      </header>

      <Disclosure
        isExpanded={isManageOpen}
        onExpandedChange={setUserExpanded}
        className="my-6 rounded-sm border border-border bg-card"
      >
        <Button
          slot="trigger"
          className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-foreground outline-none transition-colors hover:bg-row-highlight focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        >
          <span>
            管理文章来源 · 已关注{' '}
            <span className="font-mono text-primary tabular-nums">
              {preferences.followed.length}
            </span>{' '}
            个
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-150',
              isManageOpen && 'rotate-180'
            )}
          />
        </Button>

        <DisclosurePanel className="border-t border-border px-4 pb-4">
          {followingSections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`following-section-${section.id}`}
              className="mt-4"
            >
              <h2
                id={`following-section-${section.id}`}
                className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {section.title}
              </h2>
              <div className="divide-y divide-border">
                {followingSources
                  .filter((source) => source.section === section.id)
                  .map((source) => (
                    <div
                      key={source.id}
                      className="flex min-w-0 items-center justify-between gap-2 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SourceIcon source={source} className="size-4 shrink-0" />
                        <span className="truncate text-sm" title={source.name}>
                          {source.name}
                        </span>
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <ActionButton
                          variant={preferences.followed.includes(source.id) ? 'primary' : 'outline'}
                          aria-pressed={preferences.followed.includes(source.id)}
                          aria-label={`关注${source.name}`}
                          className="min-h-8 px-3 text-xs"
                          onPress={() => changeSource(source.id, 'followed')}
                        >
                          关注
                        </ActionButton>
                        <ActionButton
                          variant={preferences.hidden.includes(source.id) ? 'outline' : 'ghost'}
                          aria-pressed={preferences.hidden.includes(source.id)}
                          aria-label={`隐藏${source.name}`}
                          className="min-h-8 px-3 text-xs"
                          onPress={() => changeSource(source.id, 'hidden')}
                        >
                          隐藏
                        </ActionButton>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </DisclosurePanel>
      </Disclosure>

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <UiCheckbox isSelected={showAll} onChange={setShowAll}>
          浏览全部未隐藏来源
        </UiCheckbox>
        <UiCheckbox
          isSelected={preferences.unreadOnly}
          onChange={(unreadOnly) => save({ ...preferences, unreadOnly })}
        >
          只看未读
        </UiCheckbox>
      </div>

      {preferences.unreadOnly && (
        <p className="mb-4 font-mono text-xs text-muted-foreground">
          依据最近 100 条本地阅读记录过滤
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {selected.length ? (
        <HomeArticleList
          key={selected.join(',')}
          sources={selected}
          unreadOnly={preferences.unreadOnly}
        />
      ) : (
        <p className="text-muted-foreground">
          还没有关注任何来源，请先展开「管理文章来源」，或勾选「浏览全部未隐藏来源」。
        </p>
      )}
    </SiteShell>
  )
}
