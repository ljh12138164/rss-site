'use client'

import { useState } from 'react'
import { Button, Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { actionStyles } from './action-styles'

export function SkillInstall({ command }: { command: string }) {
  const [message, setMessage] = useState('')
  return (
    <section
      className="my-6 rounded-sm border border-border bg-card p-4 sm:p-5"
      aria-label="安装命令"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">安装</h2>
        <Button
          className={actionStyles('outline')}
          onPress={async () => {
            try {
              await navigator.clipboard.writeText(command)
              setMessage('已复制')
            } catch {
              setMessage('请手动复制下方命令')
            }
          }}
        >
          复制命令
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-sm border border-border bg-background p-3 font-mono text-xs leading-6">
        <code>{command}</code>
      </pre>
      {message && (
        <p role="status" className="mt-2 font-mono text-xs text-primary">
          {message}
        </p>
      )}
    </section>
  )
}

export function SkillContent({ html, markdown }: { html: string; markdown: string }) {
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
          阅读
        </Tab>
        <Tab
          id="raw"
          className="min-h-10 cursor-pointer whitespace-nowrap border-b-2 border-transparent py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary data-[selected]:font-semibold data-[selected]:text-primary"
        >
          原文
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
