'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button, Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { actionStyles } from './action-styles'

export function SkillInstall({ command }: { command: string }) {
  const t = useTranslations('skills')
  const tCommon = useTranslations('common')
  const [messageKey, setMessageKey] = useState<'copied' | 'manual' | null>(null)
  return (
    <section
      className="my-6 rounded-sm border border-border bg-card p-4 sm:p-5"
      aria-label={t('installCommand')}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">{t('install')}</h2>
        <Button
          className={actionStyles('outline')}
          onPress={async () => {
            try {
              await navigator.clipboard.writeText(command)
              setMessageKey('copied')
            } catch {
              setMessageKey('manual')
            }
          }}
        >
          {t('copyCommand')}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-sm border border-border bg-background p-3 font-mono text-xs leading-6">
        <code>{command}</code>
      </pre>
      {messageKey && (
        <p role="status" className="mt-2 font-mono text-xs text-primary">
          {messageKey === 'copied' ? tCommon('copied') : t('manualCopyCommand')}
        </p>
      )}
    </section>
  )
}

export function SkillContent({ html, markdown }: { html: string; markdown: string }) {
  const tCommon = useTranslations('common')
  return (
    <Tabs defaultSelectedKey="read">
      <TabList
        aria-label="SKILL.md"
        className="mb-6 flex gap-5 overflow-x-auto overflow-y-hidden border-b border-border slim-scrollbar"
      >
        <Tab
          id="read"
          className="min-h-10 cursor-pointer whitespace-nowrap border-b-2 border-transparent py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          {tCommon('read')}
        </Tab>
        <Tab
          id="raw"
          className="min-h-10 cursor-pointer whitespace-nowrap border-b-2 border-transparent py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          {tCommon('original')}
        </Tab>
      </TabList>
      <TabPanel id="read" className="outline-none">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized by the server before rendering. */}
        <div className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
      </TabPanel>
      <TabPanel id="raw" className="outline-none">
        <pre className="overflow-x-auto rounded-sm border border-border bg-card p-4 font-mono text-xs leading-7">
          <code>{markdown}</code>
        </pre>
      </TabPanel>
    </Tabs>
  )
}
