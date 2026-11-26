'use client'

import { listSignalSections, type SignalSourceId } from '@rss-site/signals'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('following')
  const tSections = useTranslations('sections')
  const preferences = useFollowing()
  const [showAll, setShowAll] = useState(false)
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null)
  const [saveError, setSaveError] = useState(false)
  const isManageOpen = userExpanded ?? !preferences.followed.length
  const selected = followingSources
    .filter(
      (source) =>
        !preferences.hidden.includes(source.id) &&
        (showAll || preferences.followed.includes(source.id))
    )
    .map((source) => source.id)

  function save(next: FollowingPreferences) {
    setSaveError(!saveFollowing(next))
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
        <h1 className="headline-display text-balance text-3xl sm:text-4xl">{t('title')}</h1>
        <p className="mt-2.5 text-pretty text-sm leading-6 text-muted-foreground">
          {t('subtitle')}
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
            {t.rich('manageSources', {
              count: preferences.followed.length,
              strongCount: (chunks) => (
                <span className="font-mono text-primary tabular-nums">{chunks}</span>
              )
            })}
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
                {tSections(`${section.id}.title`)}
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
                          aria-label={t('followSource', { source: source.name })}
                          className="min-h-8 px-3 text-xs"
                          onPress={() => changeSource(source.id, 'followed')}
                        >
                          {t('follow')}
                        </ActionButton>
                        <ActionButton
                          variant={preferences.hidden.includes(source.id) ? 'outline' : 'ghost'}
                          aria-pressed={preferences.hidden.includes(source.id)}
                          aria-label={t('hideSource', { source: source.name })}
                          className="min-h-8 px-3 text-xs"
                          onPress={() => changeSource(source.id, 'hidden')}
                        >
                          {t('hide')}
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
          {t('showAllVisible')}
        </UiCheckbox>
        <UiCheckbox
          isSelected={preferences.unreadOnly}
          onChange={(unreadOnly) => save({ ...preferences, unreadOnly })}
        >
          {t('unreadOnly')}
        </UiCheckbox>
      </div>

      {preferences.unreadOnly && (
        <p className="mb-4 font-mono text-xs text-muted-foreground">{t('unreadHint')}</p>
      )}
      {saveError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {t('saveError')}
        </p>
      )}
      {selected.length ? (
        <HomeArticleList
          key={selected.join(',')}
          sources={selected}
          unreadOnly={preferences.unreadOnly}
        />
      ) : (
        <p className="text-muted-foreground">{t('emptyHint')}</p>
      )}
    </SiteShell>
  )
}
