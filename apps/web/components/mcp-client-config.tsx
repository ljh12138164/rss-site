'use client'

import { Check, Copy, Terminal } from 'lucide-react'
import { useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { ActionButton } from './action-button'

interface ClientSnippet {
  id: string
  label: string
  command?: string
  commandDesc?: string
  filePath?: string
  fileDesc?: string
  fileCode?: string
  fileLang?: string
  tip?: string
}

const MCP_ENDPOINT = 'https://rss-api.ljhboard.cn/mcp'

const snippets: ClientSnippet[] = [
  {
    id: 'codex',
    label: 'Codex CLI',
    command: `codex mcp add rss-board-news --url ${MCP_ENDPOINT}`,
    commandDesc: '在终端执行以下命令，一键添加新闻服务到 OpenAI Codex CLI：',
    filePath: '~/.codex/config.toml',
    fileDesc: '亦可在 Codex 配置文件中直接声明：',
    fileLang: 'toml',
    fileCode: `[mcp_servers.rss-board-news]
url = "${MCP_ENDPOINT}"`,
    tip: '添加完成后，在终端运行 codex mcp list 即可验证服务连接状态与可用工具。'
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    command: `claude mcp add --transport http rss-board-news ${MCP_ENDPOINT}`,
    commandDesc: '在终端执行以下命令，一键注册到 Claude Code CLI：',
    tip: '添加完成后，在终端运行 claude mcp list 即可查看已启用的工具。'
  },
  {
    id: 'cursor',
    label: 'Cursor',
    command: `mkdir -p .cursor && echo '{"mcpServers":{"rss-board-news":{"url":"${MCP_ENDPOINT}"}}}' > .cursor/mcp.json`,
    commandDesc: '在项目根目录终端执行以下单行命令，快速生成配置文件：',
    filePath: '.cursor/mcp.json',
    fileDesc: '或手动创建/编辑配置文件，或在 Cursor Settings -> Features -> MCP 中添加：',
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
    fileDesc: '在 Windsurf 全局配置中添加远程 MCP 服务：',
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
    fileDesc: '使用 mcp-remote 桥接远程 Streamable HTTP 服务：',
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
    tip: 'macOS 路径: ~/Library/Application Support/Claude/claude_desktop_config.json | Windows 路径: %APPDATA%\\Claude\\claude_desktop_config.json'
  },
  {
    id: 'curl',
    label: 'cURL / 终端直调',
    command: `curl -X POST ${MCP_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_news","arguments":{"limit":10}}}'`,
    commandDesc: '在终端直接发送 JSON-RPC 2.0 请求调用 get_news 工具：'
  }
]

export function McpClientConfig() {
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
    <div className="space-y-6">
      {/* Endpoint Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">
            服务连接地址 (Streamable HTTP)
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-foreground break-all sm:text-base">
            {MCP_ENDPOINT}
          </div>
        </div>
        <ActionButton
          variant="outline"
          onPress={() => copyText(MCP_ENDPOINT, 'endpoint')}
          className="min-h-9 px-3 text-xs shrink-0 self-start sm:self-auto"
          aria-label="复制 MCP 服务地址"
        >
          {isEndpointCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {isEndpointCopied ? '已复制地址' : '复制地址'}
        </ActionButton>
      </div>

      {/* Tabs */}
      <Tabs defaultSelectedKey="codex" className="w-full">
        <TabList
          aria-label="客户端接入配置"
          className="flex flex-wrap gap-1.5 border-b border-border pb-2 text-sm font-medium"
        >
          {snippets.map((snippet) => (
            <Tab
              key={snippet.id}
              id={snippet.id}
              className={({ isSelected }) =>
                `cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {snippet.label}
            </Tab>
          ))}
        </TabList>

        {snippets.map((snippet) => (
          <TabPanel key={snippet.id} id={snippet.id} className="pt-4 outline-none space-y-4">
            {/* Command-level CLI Section */}
            {snippet.command && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Terminal size={14} className="text-primary" />
                  <span>{snippet.commandDesc ?? '在终端执行以下命令：'}</span>
                </div>
                <div className="relative rounded-lg border border-border bg-muted/70 p-4 font-mono text-xs sm:text-sm">
                  <ActionButton
                    variant="ghost"
                    onPress={() => copyText(snippet.command ?? '', `${snippet.id}-cmd`)}
                    className="absolute right-2.5 top-2.5 min-h-8 px-2.5 text-xs bg-background/80 hover:bg-background shadow-xs"
                    aria-label={`复制 ${snippet.label} 命令`}
                  >
                    {copiedKey === `${snippet.id}-cmd` ? (
                      <Check size={13} className="text-green-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copiedKey === `${snippet.id}-cmd` ? '已复制' : '复制命令'}
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
                  <span>{snippet.fileDesc ?? '配置文件内容：'}</span>
                  {snippet.filePath && (
                    <span className="font-mono rounded-xs bg-muted px-1.5 py-0.5 text-[11px] text-foreground">
                      {snippet.filePath}
                    </span>
                  )}
                </div>
                <div className="relative rounded-lg border border-border bg-muted/70 p-4 font-mono text-xs sm:text-sm">
                  <ActionButton
                    variant="ghost"
                    onPress={() => copyText(snippet.fileCode ?? '', `${snippet.id}-file`)}
                    className="absolute right-2.5 top-2.5 min-h-8 px-2.5 text-xs bg-background/80 hover:bg-background shadow-xs"
                    aria-label={`复制 ${snippet.label} 配置`}
                  >
                    {copiedKey === `${snippet.id}-file` ? (
                      <Check size={13} className="text-green-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copiedKey === `${snippet.id}-file` ? '已复制' : '复制配置'}
                  </ActionButton>
                  <pre className="overflow-x-auto pr-20 leading-relaxed text-foreground">
                    <code>{snippet.fileCode}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Tip note */}
            {snippet.tip && (
              <div className="text-xs text-muted-foreground bg-muted/30 border border-border/60 rounded-md p-2.5 leading-5">
                💡 {snippet.tip}
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  )
}
