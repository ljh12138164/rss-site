'use client'

import Link from 'next/link'
import { ActionButton } from '../../../components/action-button'
import { actionStyles } from '../../../components/action-styles'
import { useSiteText } from '../../../components/site-language'
import { SiteShell } from '../../../components/site-shell'

export default function SkillError({ reset }: { reset: () => void }) {
  const t = useSiteText()
  return (
    <SiteShell mainClassName="mx-auto flex w-full max-w-[42rem] items-center py-12 sm:py-20">
      <div role="alert" className="w-full rounded-sm border border-border bg-card p-6 sm:p-8">
        <span className="inline-flex items-center rounded-sm bg-destructive/14 px-2 py-0.5 font-mono text-xs font-semibold text-destructive">
          {t('加载异常')}
        </span>
        <h1 className="headline-display mt-4 text-3xl sm:text-4xl">{t('暂时无法加载 Skill')}</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          {t('请稍后重试或返回榜单列表。')}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ActionButton onPress={reset} variant="primary">
            {t('重试')}
          </ActionButton>
          <Link className={actionStyles('outline')} href="/skills">
            {t('返回 Skills')}
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
