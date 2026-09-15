import type { McpNewsItem } from './service.js'
import { formatMcpNewsResponse } from './service.js'

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export interface McpHandlerDeps {
  fetchNews(options: { platform?: string; limit?: number }): Promise<McpNewsItem[]>
}

export const MCP_TOOLS = [
  {
    name: 'get_news',
    description:
      '获取全网最新热点新闻资讯。支持传入 platform 参数筛选特定平台或分类；如果不传 platform 参数，默认返回全平台最新的 100 条热点新闻。',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          description:
            '新闻来源平台 ID（例如：github, juejin, ithome, 36kr, zhihu, weibo, bilibili, openai, chatgpt, zaobao 等）或分类名称（例如：technology, ai, news, social, finance, games）。可选；不传则返回全平台最新新闻。'
        },
        limit: {
          type: 'number',
          description: '获取的新闻条数（1-100），默认为 100。'
        }
      }
    }
  }
]

export async function processSingleMcpRequest(
  request: JsonRpcRequest,
  deps: McpHandlerDeps
): Promise<JsonRpcResponse | null> {
  const { id = null, method, params } = request

  // If it's a notification (no id), e.g. notifications/initialized
  if (id === undefined && method.startsWith('notifications/')) {
    return null
  }

  switch (method) {
    case 'initialize': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'rss-site-mcp',
            version: '1.0.0'
          },
          instructions:
            '该 MCP 服务提供全网最新热点资讯查询。支持按平台或分类筛选新闻，若不提供 platform 参数则默认返回全平台最新 100 条新闻。'
        }
      }
    }

    case 'notifications/initialized': {
      return null
    }

    case 'ping': {
      return {
        jsonrpc: '2.0',
        id,
        result: {}
      }
    }

    case 'tools/list': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS
        }
      }
    }

    case 'tools/call': {
      const toolName = params?.name
      const toolArgs = (params?.arguments as Record<string, unknown> | undefined) ?? {}

      if (toolName !== 'get_news') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `未知工具: ${String(toolName)}。当前仅支持 get_news 工具。`
              }
            ],
            isError: true
          }
        }
      }

      const platform = typeof toolArgs.platform === 'string' ? toolArgs.platform : undefined
      const limit = typeof toolArgs.limit === 'number' ? toolArgs.limit : undefined

      try {
        const items = await deps.fetchNews({ platform, limit })
        const textResponse = formatMcpNewsResponse(items, platform)

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: textResponse
              }
            ],
            isError: false
          }
        }
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `获取新闻失败: ${error instanceof Error ? error.message : String(error)}`
              }
            ],
            isError: true
          }
        }
      }
    }

    default: {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      }
    }
  }
}

export async function handleMcpJsonRpc(
  body: unknown,
  deps: McpHandlerDeps
): Promise<JsonRpcResponse | (JsonRpcResponse | null)[] | null> {
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((item) =>
        isValidJsonRpcRequest(item)
          ? processSingleMcpRequest(item, deps)
          : ({
              jsonrpc: '2.0',
              id: null,
              error: { code: -32600, message: 'Invalid Request' }
            } satisfies JsonRpcResponse)
      )
    )
    const filtered = responses.filter(Boolean)
    return filtered.length > 0 ? filtered : null
  }

  if (!isValidJsonRpcRequest(body)) {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request' }
    }
  }

  return processSingleMcpRequest(body, deps)
}

function isValidJsonRpcRequest(item: unknown): item is JsonRpcRequest {
  if (typeof item !== 'object' || item === null) return false
  const candidate = item as Record<string, unknown>
  return candidate.jsonrpc === '2.0' && typeof candidate.method === 'string'
}
