'use client'

import { listSignalSections, type SignalSourceId } from '@rss-site/signals'
import { useState } from 'react'
import { ActionButton } from '../../components/action-button'
import { HomeArticleList } from '../../components/home-article-list'
import { SiteShell } from '../../components/site-shell'
import { SourceIcon } from '../../components/source-icon'
import {
  type FollowingPreferences,
  followingSources,
  saveFollowing,
  useFollowing
} from '../../lib/following'

export default function FollowingPage() {
  const preferences = useFollowing()
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState('')
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
      <details
        className="my-6 rounded-sm border border-border bg-card p-4"
        open={!preferences.followed.length}
      >
        <summary className="cursor-pointer py-2 font-semibold focus-visible:outline-2 focus-visible:outline-primary">
          管理文章来源 · 已关注 <span className="tabular-nums">{preferences.followed.length}</span>{' '}
          个
        </summary>
        {listSignalSections()
          .filter((section) => followingSources.some((source) => source.section === section.id))
          .map((section) => (
            <fieldset key={section.id} className="mt-4">
              <legend className="text-sm font-semibold text-muted-foreground">
                {section.title}
              </legend>
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
                          onPress={() => changeSource(source.id, 'followed')}
                        >
                          关注
                        </ActionButton>
                        <ActionButton
                          variant={preferences.hidden.includes(source.id) ? 'outline' : 'ghost'}
                          aria-pressed={preferences.hidden.includes(source.id)}
                          aria-label={`隐藏${source.name}`}
                          onPress={() => changeSource(source.id, 'hidden')}
                        >
                          隐藏
                        </ActionButton>
                      </div>
                    </div>
                  ))}
              </div>
            </fieldset>
          ))}
      </details>
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          浏览全部未隐藏来源
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preferences.unreadOnly}
            onChange={(e) => save({ ...preferences, unreadOnly: e.target.checked })}
          />
          只看未读
        </label>
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
        <p
          role="status"
          className="rounded-sm border border-border bg-card py-10 text-center text-sm text-muted-foreground"
        >
          请在上方选择要关注的平台。
        </p>
      )}
    </SiteShell>
  )
}
