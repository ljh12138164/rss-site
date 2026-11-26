'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ActionButton } from '../components/action-button'
import { actionStyles } from '../components/action-styles'

export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60dvh] w-full max-w-[42rem] items-center px-5 py-12 sm:px-7"
    >
      <div className="w-full rounded-sm border border-border bg-card p-6 sm:p-8">
        <span className="inline-flex items-center rounded-sm bg-destructive/14 px-2 py-0.5 font-mono text-xs font-semibold text-destructive">
          {t('loadBadge')}
        </span>
        <h1 className="headline-display mt-4 text-3xl sm:text-4xl">{t('pageFailedTitle')}</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{t('pageFailedBody')}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ActionButton onPress={reset} variant="primary">
            {tCommon('reload')}
          </ActionButton>
          <Link className={actionStyles('outline')} href="/">
            {tCommon('browseAllStories')}
          </Link>
        </div>
      </div>
    </div>
  )
}
