import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { configureApp } from '../http-app.js'
import type { McpNewsItem } from './service.js'

interface TestMcpResult {
  jsonrpc: string
  id?: number | null
  result?: {
    protocolVersion?: string
    capabilities?: Record<string, unknown>
    serverInfo?: { name: string; version?: string }
    tools?: Array<{ name: string; inputSchema: { properties: Record<string, unknown> } }>
    content?: Array<{ type: string; text: string }>
    isError?: boolean
  }
  error?: {
    code: number
    message: string
  }
}

interface TestNewsApiResult {
  items: unknown[]
  total: number
  platform: string | null
}

function createSampleArticles(count: number): McpNewsItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `article-${i + 1}`,
    title: `测试新闻标题 ${i + 1}`,
    url: `https://example.com/news/${i + 1}`,
    source: i % 2 === 0 ? 'juejin' : 'github',
    sourceName: i % 2 === 0 ? '掘金' : 'GitHub Trending',
    section: 'technology',
    summary: `这是测试新闻 ${i + 1} 的摘要内容。`,
    author: `作者 ${i + 1}`,
    publishedAt: new Date(Date.now() - i * 60000),
    firstSeenAt: new Date(Date.now() - i * 60000)
  }))
}

describe('MCP News Service in Hono API', () => {
  it('handles MCP initialize handshake', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          clientInfo: { name: 'cursor', version: '1.0' }
        }
      })
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'rss-site-mcp' }
      }
    })
  })

  it('handles tools/list and exposes get_news tool', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      })
    })

    expect(response.status).toBe(200)
    const json = (await response.json()) as TestMcpResult
    expect(json.result?.tools).toHaveLength(1)
    expect(json.result?.tools?.[0].name).toBe('get_news')
    expect(json.result?.tools?.[0].inputSchema.properties).toHaveProperty('platform')
    expect(json.result?.tools?.[0].inputSchema.properties).toHaveProperty('limit')
  })

  it('calls get_news tool without platform and defaults to fetching 100 articles', async () => {
    let capturedOptions: { platform?: string; limit?: number } | undefined
    const mockArticles = createSampleArticles(100)

    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 }),
      fetchNews: async (options) => {
        capturedOptions = options
        return mockArticles
      }
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_news',
          arguments: {}
        }
      })
    })

    expect(response.status).toBe(200)
    const json = (await response.json()) as TestMcpResult
    expect(capturedOptions).toEqual({ platform: undefined, limit: undefined })
    expect(json.result?.isError).toBe(false)
    expect(json.result?.content?.[0].type).toBe('text')
    expect(json.result?.content?.[0].text).toContain('共获取到 100 条最新新闻（筛选条件：全平台）')
    expect(json.result?.content?.[0].text).toContain('测试新闻标题 1')
  })

  it('calls get_news tool with platform and limit arguments', async () => {
    let capturedOptions: { platform?: string; limit?: number } | undefined
    const mockArticles = createSampleArticles(20)

    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 }),
      fetchNews: async (options) => {
        capturedOptions = options
        return mockArticles.filter((a) => a.source === 'juejin')
      }
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'get_news',
          arguments: {
            platform: 'juejin',
            limit: 20
          }
        }
      })
    })

    expect(response.status).toBe(200)
    const json = (await response.json()) as TestMcpResult
    expect(capturedOptions).toEqual({ platform: 'juejin', limit: 20 })
    expect(json.result?.isError).toBe(false)
    expect(json.result?.content?.[0].text).toContain('平台/分类 "juejin"')
  })

  it('handles unknown tools gracefully', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      })
    })

    expect(response.status).toBe(200)
    const json = (await response.json()) as TestMcpResult
    expect(json.result?.isError).toBe(true)
    expect(json.result?.content?.[0].text).toContain('未知工具')
  })

  it('handles ping request', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 6,
        method: 'ping'
      })
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual({ jsonrpc: '2.0', id: 6, result: {} })
  })

  it('handles notifications/initialized without response body', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      })
    })

    expect(response.status).toBe(204)
  })

  it('returns method not found for unknown methods', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 7,
        method: 'unknown/method'
      })
    })

    expect(response.status).toBe(200)
    const json = (await response.json()) as TestMcpResult
    expect(json.error?.code).toBe(-32601)
  })

  it('serves SSE handshake on GET /mcp and GET /sse', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const resMcp = await app.request('/mcp')
    expect(resMcp.status).toBe(200)
    expect(resMcp.headers.get('Content-Type')).toContain('text/event-stream')
    expect(await resMcp.text()).toBe('event: endpoint\ndata: /mcp\n\n')

    const resSse = await app.request('/sse')
    expect(resSse.status).toBe(200)
    expect(resSse.headers.get('Content-Type')).toContain('text/event-stream')
    expect(await resSse.text()).toBe('event: endpoint\ndata: /mcp\n\n')
  })

  it('handles GET /api/news REST queries with platform and limit', async () => {
    let capturedOptions: { platform?: string; limit?: number } | undefined
    const mockArticles = createSampleArticles(10)

    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 }),
      fetchNews: async (options) => {
        capturedOptions = options
        return mockArticles
      }
    })

    const response = await app.request('/api/news?platform=openai&limit=10')
    expect(response.status).toBe(200)
    const json = (await response.json()) as TestNewsApiResult
    expect(capturedOptions).toEqual({ platform: 'openai', limit: 10 })
    expect(json.total).toBe(10)
    expect(json.platform).toBe('openai')
    expect(json.items).toHaveLength(10)
  })

  it('handles CORS OPTIONS preflight for /mcp and /api/news', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 0 })
    })

    const mcpOptions = await app.request('/mcp', { method: 'OPTIONS' })
    expect(mcpOptions.status).toBe(204)
    expect(mcpOptions.headers.get('Access-Control-Allow-Origin')).toBe('*')

    const apiOptions = await app.request('/api/news', { method: 'OPTIONS' })
    expect(apiOptions.status).toBe(204)
    expect(apiOptions.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
