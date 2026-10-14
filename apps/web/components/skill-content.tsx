'use client'

import { useState } from 'react'
import { Button, Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { actionStyles } from './action-styles'

export function SkillInstall({ command }: { command: string }) {
  const [message, setMessage] = useState('')
  return (
    <section
      className="my-8 rounded-lg border border-border bg-muted/40 p-4 sm:p-5"
      aria-label="安装"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-medium">安装</h2>
        <Button
          className={actionStyles('outline')}
          onPress={async () => {
            try {
              await navigator.clipboard.writeText(command)
              setMessage('已复制')
            } catch {
              setMessage('复制失败，请手动复制下方命令')
            }
          }}
        >
          复制命令
        </Button>
      </div>
      <pre className="overflow-x-auto text-sm leading-7">
        <code>{command}</code>
      </pre>
      {message && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </section>
  )
}

export function SkillContent({ html, markdown }: { html: string; markdown: string }) {
  return (
    <Tabs defaultSelectedKey="read">
      <TabList aria-label="SKILL.md 视图" className="mb-6 flex gap-5 border-b border-border">
        <Tab
          id="read"
          className="min-h-11 cursor-pointer border-b-2 border-transparent py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary"
        >
          阅读
        </Tab>
        <Tab
          id="raw"
          className="min-h-11 cursor-pointer border-b-2 border-transparent py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:border-primary"
        >
          原文
        </Tab>
      </TabList>
      <TabPanel id="read" className="outline-none">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized by the server before rendering. */}
        <div className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
      </TabPanel>
      <TabPanel id="raw" className="outline-none">
        <pre className="overflow-x-auto rounded-lg bg-muted/40 p-4 text-sm leading-7">
          <code>{markdown}</code>
        </pre>
      </TabPanel>
    </Tabs>
  )
}
