import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import McpPage, { metadata } from './page'

vi.mock('next/navigation', () => ({ usePathname: () => '/mcp' }))
vi.mock('../../components/article-search', () => ({ ArticleSearch: () => null }))
vi.mock('../../components/theme-toggle', () => ({ ThemeToggle: () => null }))

describe('MCP Page (/mcp)', () => {
  it('exposes valid page metadata', () => {
    expect(metadata.title).toBe('接入 MCP 服务 - 今日热点')
    expect(metadata.description).toContain('Cursor')
  })

  it('renders endpoint, tool definition, default 100 limit, and platforms', () => {
    const html = renderToStaticMarkup(<McpPage />)

    // Heading and title
    expect(html).toContain('接入 MCP 新闻服务')
    expect(html).toContain('Model Context Protocol')

    // Endpoint
    expect(html).toContain('https://rss-api.ljhboard.cn/mcp')

    // Tool name and default 100 rule
    expect(html).toContain('get_news')
    expect(html).toContain('100 条')
    expect(html).toContain('无（全平台）')

    // Client tabs (all in TabList) & selected default tab command (Codex CLI)
    expect(html).toContain('Codex CLI')
    expect(html).toContain('codex mcp add')
    expect(html).toContain('Claude Code')
    expect(html).toContain('Cursor')
    expect(html).toContain('Claude Desktop')
    expect(html).toContain('Windsurf')
    expect(html).toContain('cURL / 终端直调')

    // Platform directory
    expect(html).toContain('juejin')
    expect(html).toContain('github')
    expect(html).toContain('openai')
    expect(html).toContain('technology')
    expect(html).toContain('ai')

    // Footer link
    expect(html).toContain('href="/mcp"')
  })
})
