'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import { ActionButton } from './action-button'

interface ConfigSnippet {
  id: string
  label: string
  filePath?: string
  description: string
  code: string
  language: string
}

const MCP_ENDPOINT = 'https://rss-api.ljhboard.cn/mcp'

const snippets: ConfigSnippet[] = [
  {
    id: 'cursor',
    label: 'Cursor',
    filePath: '.cursor/mcp.json',
    description:
      '在项目根目录创建或编辑 .cursor/mcp.json，或在 Cursor 设置 -> Features -> MCP 中添加：',
    language: 'json',
    code: JSON.stringify(
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
    id: 'claude',
    label: 'Claude Desktop',
    filePath: 'claude_desktop_config.json',
    description: '使用 mcp-remote 桥接远程 Streamable HTTP 服务：',
    language: 'json',
    code: JSON.stringify(
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
    )
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    filePath: '~/.codeium/windsurf/mcp_config.json',
    description: '在 Windsurf 全局配置中添加远程 MCP 服务：',
    language: 'json',
    code: JSON.stringify(
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
    id: 'curl',
    label: 'cURL / 命令行',
    description: '直接使用 cURL 发送 JSON-RPC 2.0 请求测试工具调用：',
    language: 'bash',
    code: `curl -X POST ${MCP_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_news","arguments":{"limit":10}}}'`
  }
]

export function McpClientConfig() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)

  async function copyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore
    }
  }

  async function copyEndpoint() {
    try {
      await navigator.clipboard.writeText(MCP_ENDPOINT)
      setCopiedEndpoint(true)
      setTimeout(() => setCopiedEndpoint(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Endpoint Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">
            服务连接地址 (Streamable HTTP / SSE)
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-foreground break-all sm:text-base">
            {MCP_ENDPOINT}
          </div>
        </div>
        <ActionButton
          variant="outline"
          onPress={copyEndpoint}
          className="min-h-9 px-3 text-xs shrink-0 self-start sm:self-auto"
          aria-label="复制 MCP 服务地址"
        >
          {copiedEndpoint ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copiedEndpoint ? '已复制地址' : '复制地址'}
        </ActionButton>
      </div>

      {/* Tabs */}
      <Tabs defaultSelectedKey="cursor" className="w-full">
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
          <TabPanel key={snippet.id} id={snippet.id} className="pt-4 outline-none">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{snippet.description}</span>
                {snippet.filePath && (
                  <span className="font-mono rounded-xs bg-muted px-1.5 py-0.5 text-[11px] text-foreground">
                    {snippet.filePath}
                  </span>
                )}
              </div>
              <div className="relative rounded-lg border border-border bg-muted/70 p-4 font-mono text-xs sm:text-sm">
                <ActionButton
                  variant="ghost"
                  onPress={() => copyText(snippet.code, snippet.id)}
                  className="absolute right-2.5 top-2.5 min-h-8 px-2.5 text-xs bg-background/80 hover:bg-background shadow-xs"
                  aria-label={`复制 ${snippet.label} 配置`}
                >
                  {copiedId === snippet.id ? (
                    <Check size={13} className="text-green-500" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copiedId === snippet.id ? '已复制' : '复制配置'}
                </ActionButton>
                <pre className="overflow-x-auto pr-20 leading-relaxed text-foreground">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  )
}
