import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  skillSources,
  socialSources,
  technologySources
} from '@rss-site/signals'
import { Cpu, Sparkles, Terminal, Wrench } from 'lucide-react'
import { McpClientConfig } from '../../components/mcp-client-config'
import { SiteShell } from '../../components/site-shell'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: '接入 MCP 服务',
  description:
    '在 Codex CLI、Claude Code、Cursor、Claude Desktop 等客户端接入今日热点 MCP 服务，按平台或分类查询最新 100 条热点。',
  path: '/mcp'
})

const sectionsInfo = [
  {
    title: '科技资讯',
    sectionKey: 'technology',
    sources: technologySources
  },
  {
    title: 'AI 动态',
    sectionKey: 'ai',
    sources: aiSources
  },
  {
    title: '社交热榜',
    sectionKey: 'social',
    sources: socialSources
  },
  {
    title: '综合新闻',
    sectionKey: 'news',
    sources: newsSources
  },
  {
    title: '财经热点',
    sectionKey: 'finance',
    sources: financeSources
  },
  {
    title: '游戏动态',
    sectionKey: 'games',
    sources: gameSources
  },
  {
    title: 'Skills 排行',
    sectionKey: 'skills',
    sources: skillSources
  }
]

const samplePrompts = [
  {
    title: '全网热点早报',
    prompt:
      '获取全平台最新的 100 条热点新闻，从中挑选出今天最重要的 5 个科技与社会热点并做晨报汇总。'
  },
  {
    title: '科技与开源动态',
    prompt:
      '查询掘金（juejin）和 GitHub Trending（github）最新的热门项目与文章，并简要概括技术趋势。'
  },
  {
    title: '追踪 AI 与大模型发布',
    prompt: '使用 get_news 查询 OpenAI、ChatGPT 或 DeepSeek 的最新发布日志与产品动态。'
  },
  {
    title: '财经市场速览',
    prompt: '以 finance 分类查询今天最新的 30 条财经热点，整理出市场重点关注的主题。'
  }
]

export default function McpPage() {
  return (
    <SiteShell mainClassName="mx-auto w-full max-w-4xl">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="headline-display text-balance text-3xl text-foreground sm:text-4xl">
          接入 MCP 服务
        </h1>
        <p className="mt-2.5 text-pretty text-sm leading-6 text-muted-foreground">
          将本站接入 Codex CLI、Claude Code、Cursor 等客户端，在对话中直接查询已收录热点。
        </p>
      </header>

      <div className="space-y-10">
        {/* Section 1: Client Config */}
        <section aria-labelledby="client-config-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Terminal size={18} className="text-primary" />
            <h2 id="client-config-heading">客户端接入</h2>
          </div>
          <McpClientConfig />
        </section>

        {/* Section 2: Tool Specification */}
        <section aria-labelledby="tool-spec-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Wrench size={18} className="text-primary" />
            <h2 id="tool-spec-heading">工具接口</h2>
          </div>

          <div className="space-y-4 rounded-sm border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-bold text-primary">get_news</span>
              <span className="rounded-sm bg-primary/14 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                MCP Tool
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              按平台或分类查询热点；不传参数时默认返回全平台最新 100 条。
            </p>

            {/* Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-xs text-muted-foreground">
                    <th className="py-2.5 font-medium">参数名</th>
                    <th className="py-2.5 font-medium">类型</th>
                    <th className="py-2.5 font-medium">必填</th>
                    <th className="py-2.5 font-medium">默认值</th>
                    <th className="py-2.5 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 font-mono font-semibold text-foreground">platform</td>
                    <td className="py-3 font-mono text-muted-foreground">string</td>
                    <td className="py-3 text-muted-foreground">否</td>
                    <td className="py-3 text-muted-foreground">全平台</td>
                    <td className="py-3 text-muted-foreground">
                      平台 ID（如 <code className="text-foreground">juejin</code>、
                      <code className="text-foreground">github</code>、
                      <code className="text-foreground">openai</code>）或频道名（如{' '}
                      <code className="text-foreground">technology</code>、
                      <code className="text-foreground">ai</code>）。
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono font-semibold text-foreground">limit</td>
                    <td className="py-3 font-mono text-muted-foreground">number</td>
                    <td className="py-3 text-muted-foreground">否</td>
                    <td className="py-3 font-mono font-semibold text-primary">100</td>
                    <td className="py-3 text-muted-foreground">返回条数（1～100）。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Supported Platforms Directory */}
        <section aria-labelledby="platforms-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Cpu size={18} className="text-primary" />
            <h2 id="platforms-heading">平台与频道 ID</h2>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {sectionsInfo.map((section) => (
              <div
                key={section.sectionKey}
                className="space-y-2.5 rounded-sm border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                  <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary">
                    {section.sectionKey}
                  </code>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {section.sources.map((source) => (
                    <span
                      key={source.id}
                      className="inline-flex items-center gap-1 rounded-sm border border-border bg-secondary px-2 py-1 text-xs text-foreground"
                    >
                      <span>{source.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {source.id}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Sample Prompts */}
        <section aria-labelledby="prompts-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles size={18} className="text-primary" />
            <h2 id="prompts-heading">提问示例</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {samplePrompts.map((item) => (
              <div
                key={item.title}
                className="space-y-1.5 rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary/45"
              >
                <div className="font-mono text-xs font-semibold text-primary">{item.title}</div>
                <div className="text-xs leading-6 text-foreground sm:text-sm">
                  &ldquo;{item.prompt}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  )
}
