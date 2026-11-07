import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { configureApp } from '../http-app.js'
import { formatMcpNewsResponse, type McpNewsItem } from './service.js'

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

  it('formats news items and falls back to firstSeenAt when publishedAt is null', () => {
    const formatted = formatMcpNewsResponse([
      {
        id: 'article-with-date',
        title: '有发布时间的新闻',
        url: 'https://example.com/dated',
        source: 'openai',
        sourceName: 'OpenAI Blog',
        section: 'ai',
        summary: '这是有日期的内容。',
        author: 'OpenAI',
        publishedAt: new Date('2026-03-15T12:00:00Z'),
        firstSeenAt: new Date('2026-03-15T12:05:00Z')
      },
      {
        id: 'article-without-date',
        title: '无发布时间的榜单项目',
        url: 'https://example.com/undated',
        source: 'baidu',
        sourceName: '百度热搜',
        section: 'social',
        summary: null,
        author: null,
        publishedAt: null,
        firstSeenAt: new Date('2026-03-15T10:00:00Z')
      }
    ])

    expect(formatted).toContain('共获取到 2 条最新新闻')
    expect(formatted).toContain('1. [有发布时间的新闻](https://example.com/dated)')
    expect(formatted).toContain('平台: OpenAI Blog (openai) | 分类: ai | 时间: 2026-03-15 12:00')
    expect(formatted).toContain('2. [无发布时间的榜单项目](https://example.com/undated)')
    expect(formatted).toContain('平台: 百度热搜 (baidu) | 分类: social | 时间: 2026-03-15 10:00')
  })
})
