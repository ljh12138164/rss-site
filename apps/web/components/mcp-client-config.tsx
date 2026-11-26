'use client'

import { Check, Copy, Terminal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { ActionButton } from './action-button'

type McpDescKey =
  | 'codexCmdDesc'
  | 'codexFileDesc'
  | 'codexTip'
  | 'claudeCodeCmdDesc'
  | 'claudeCodeTip'
  | 'cursorCmdDesc'
  | 'cursorFileDesc'
  | 'windsurfFileDesc'
  | 'claudeDesktopFileDesc'
  | 'claudeDesktopTip'
  | 'curlCmdDesc'

interface ClientSnippet {
  id: string
  label: string
  labelKey?: 'curlLabel'
  command?: string
  commandDescKey?: McpDescKey
  filePath?: string
  fileDescKey?: McpDescKey
  fileCode?: string
  fileLang?: string
  tipKey?: McpDescKey
}

const MCP_ENDPOINT = 'https://news.ljhboard.cn/api/mcp'

const snippets: ClientSnippet[] = [
  {
    id: 'codex',
    label: 'Codex CLI',
    command: `codex mcp add rss-board-news --url ${MCP_ENDPOINT}`,
    commandDescKey: 'codexCmdDesc',
    filePath: '~/.codex/config.toml',
    fileDescKey: 'codexFileDesc',
    fileLang: 'toml',
    fileCode: `[mcp_servers.rss-board-news]
url = "${MCP_ENDPOINT}"`,
    tipKey: 'codexTip'
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    command: `claude mcp add --transport http rss-board-news ${MCP_ENDPOINT}`,
    commandDescKey: 'claudeCodeCmdDesc',
    tipKey: 'claudeCodeTip'
  },
  {
    id: 'cursor',
    label: 'Cursor',
    command: `mkdir -p .cursor && echo '{"mcpServers":{"rss-board-news":{"url":"${MCP_ENDPOINT}"}}}' > .cursor/mcp.json`,
    commandDescKey: 'cursorCmdDesc',
    filePath: '.cursor/mcp.json',
    fileDescKey: 'cursorFileDesc',
    fileLang: 'json',
    fileCode: JSON.stringify(
      {
        mcpServers: {
          'rss-board-news': {
            url: MCP_ENDPOINT
          }
        }
      },
      null,
      2
    )
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    filePath: '~/.codeium/windsurf/mcp_config.json',
    fileDescKey: 'windsurfFileDesc',
    fileLang: 'json',
    fileCode: JSON.stringify(
      {
        mcpServers: {
          'rss-board-news': {
            url: MCP_ENDPOINT
          }
        }
      },
      null,
      2
    )
  },
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    filePath: 'claude_desktop_config.json',
    fileDescKey: 'claudeDesktopFileDesc',
    fileLang: 'json',
    fileCode: JSON.stringify(
      {
        mcpServers: {
          'rss-board-news': {
            command: 'npx',
            args: ['-y', 'mcp-remote', MCP_ENDPOINT]
          }
        }
      },
      null,
      2
    ),
    tipKey: 'claudeDesktopTip'
  },
  {
    id: 'curl',
    label: 'cURL',
    labelKey: 'curlLabel',
    command: `curl -X POST ${MCP_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_news","arguments":{"limit":10}}}'`,
    commandDescKey: 'curlCmdDesc'
  }
]

export function McpClientConfig() {
  const t = useTranslations('mcp')
  const tCommon = useTranslations('common')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // ignore
    }
  }

  const isEndpointCopied = copiedKey === 'endpoint'

  return (
    <div className="space-y-5">
      {/* Endpoint Bar */}
      <div className="flex flex-col gap-3 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-xs text-muted-foreground">{t('endpointLabel')}</div>
          <div className="mt-1 break-all font-mono text-sm font-semibold text-foreground sm:text-base">
            {MCP_ENDPOINT}
          </div>
        </div>
        <ActionButton
          variant="outline"
          onPress={() => copyText(MCP_ENDPOINT, 'endpoint')}
          className="min-h-9 shrink-0 self-start px-3 text-xs sm:self-auto"
          aria-label={t('copyEndpointAria')}
        >
          {isEndpointCopied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
          {isEndpointCopied ? tCommon('copied') : t('copyUrl')}
        </ActionButton>
      </div>

      {/* Tabs */}
      <Tabs defaultSelectedKey="codex" className="w-full">
        <TabList
          aria-label={t('tabsAria')}
          className="flex flex-wrap gap-1.5 border-b border-border pb-2 text-sm font-medium"
        >
          {snippets.map((snippet) => (
            <Tab
              key={snippet.id}
              id={snippet.id}
              className={({ isSelected }) =>
                `cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary font-semibold text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              {snippet.labelKey ? t(snippet.labelKey) : snippet.label}
            </Tab>
          ))}
        </TabList>

        {snippets.map((snippet) => {
          const displayLabel = snippet.labelKey ? t(snippet.labelKey) : snippet.label
          return (
            <TabPanel key={snippet.id} id={snippet.id} className="space-y-4 pt-4 outline-none">
              {/* Command-level CLI Section */}
              {snippet.command && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Terminal size={14} className="text-primary" />
                    <span>
                      {snippet.commandDescKey ? t(snippet.commandDescKey) : t('defaultCmdDesc')}
                    </span>
                  </div>
                  <div className="relative rounded-sm border border-border bg-muted p-4 font-mono text-xs sm:text-sm">
                    <ActionButton
                      variant="ghost"
                      onPress={() => copyText(snippet.command ?? '', `${snippet.id}-cmd`)}
                      className="absolute top-2.5 right-2.5 min-h-8 bg-card px-2.5 text-xs shadow-xs hover:bg-accent"
                      aria-label={t('copyCmdAria', { label: displayLabel })}
                    >
                      {copiedKey === `${snippet.id}-cmd` ? (
                        <Check size={13} className="text-primary" />
                      ) : (
                        <Copy size={13} />
                      )}
                      {copiedKey === `${snippet.id}-cmd` ? tCommon('copied') : t('copyCmd')}
                    </ActionButton>
                    <pre className="overflow-x-auto pr-20 leading-relaxed text-foreground">
                      <code>{snippet.command}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Config File Section */}
              {snippet.fileCode && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {snippet.fileDescKey ? t(snippet.fileDescKey) : t('defaultFileDesc')}
                    </span>
                    {snippet.filePath && (
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                        {snippet.filePath}
                      </span>
                    )}
                  </div>
                  <div className="relative rounded-sm border border-border bg-muted p-4 font-mono text-xs sm:text-sm">
                    <ActionButton
                      variant="ghost"
                      onPress={() => copyText(snippet.fileCode ?? '', `${snippet.id}-file`)}
                      className="absolute top-2.5 right-2.5 min-h-8 bg-card px-2.5 text-xs shadow-xs hover:bg-accent"
                      aria-label={t('copyConfigAria', { label: displayLabel })}
                    >
                      {copiedKey === `${snippet.id}-file` ? (
                        <Check size={13} className="text-primary" />
                      ) : (
                        <Copy size={13} />
                      )}
                      {copiedKey === `${snippet.id}-file` ? tCommon('copied') : t('copyConfig')}
                    </ActionButton>
                    <pre className="overflow-x-auto pr-20 leading-relaxed text-foreground">
                      <code>{snippet.fileCode}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Tip note */}
              {snippet.tipKey && (
                <div className="rounded-sm border border-border bg-card px-3 py-2 font-mono text-xs leading-5 text-muted-foreground">
                  {t(snippet.tipKey)}
                </div>
              )}
            </TabPanel>
          )
        })}
      </Tabs>
    </div>
  )
}
