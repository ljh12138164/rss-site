import { Bot, Cpu, Sparkles, Terminal, Wrench } from 'lucide-react'
import type { Metadata } from 'next'
import { McpClientConfig } from '../../components/mcp-client-config'
import { SiteShell } from '../../components/site-shell'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  skillSources,
  socialSources,
  technologySources
} from '../../lib/technology-sources'

export const metadata: Metadata = {
  title: '接入 MCP 服务 - 今日热点',
  description:
    '将全网热点资讯直接接入 Cursor、Claude Desktop、Windsurf 等 AI 客户端，支持平台级传参与分类筛选，默认返回全网最新 100 条热点。'
}

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
    <SiteShell mainClassName="mx-auto w-full max-w-4xl py-8 sm:py-12">
      {/* Page Header */}
      <header className="mb-10 border-l-4 border-primary pl-4 sm:mb-12">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Bot size={16} />
          Model Context Protocol
        </div>
        <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          接入 MCP 新闻服务
        </h1>
        <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
          为 Cursor、Claude Desktop、Windsurf
          等客户端提供直接连接本站的工具。大模型可自主调用工具获取全网实时热点资讯。
        </p>
      </header>

      <div className="space-y-12">
        {/* Section 1: Client Config */}
        <section aria-labelledby="client-config-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Terminal size={20} className="text-primary" />
            <h2 id="client-config-heading">客户端快速接入</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            选择你正在使用的 AI 开发工具或客户端，复制对应的配置代码并保存即可自动连接本站 MCP
            服务：
          </p>
          <McpClientConfig />
        </section>

        {/* Section 2: Tool Specification */}
        <section aria-labelledby="tool-spec-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Wrench size={20} className="text-primary" />
            <h2 id="tool-spec-heading">工具接口定义 (`get_news`)</h2>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-base font-bold text-primary">get_news</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                MCP Tool
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              获取最新热点新闻资讯，支持按平台或分类筛选。若不提供任何参数，默认返回全平台最新的 100
              条热点。
            </p>

            {/* Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
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
                    <td className="py-3 text-muted-foreground">string</td>
                    <td className="py-3 text-muted-foreground">否</td>
                    <td className="py-3 text-muted-foreground">无（全平台）</td>
                    <td className="py-3 text-muted-foreground">
                      来源平台 ID（如 <code className="text-foreground">juejin</code>、
                      <code className="text-foreground">github</code>、
                      <code className="text-foreground">openai</code>）或一级分类名称（如{' '}
                      <code className="text-foreground">technology</code>、
                      <code className="text-foreground">ai</code>）。
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono font-semibold text-foreground">limit</td>
                    <td className="py-3 text-muted-foreground">number</td>
                    <td className="py-3 text-muted-foreground">否</td>
                    <td className="py-3 font-mono text-primary font-semibold">100</td>
                    <td className="py-3 text-muted-foreground">返回条数，范围 1～100 条。</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Default 100 highlight */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs sm:text-sm leading-6 text-foreground">
              <span className="font-semibold text-primary">默认策略：</span>当 AI 调用工具时不传{' '}
              <code className="font-mono font-semibold">platform</code>{' '}
              参数时，服务将自动检索全平台最新入库的{' '}
              <strong className="font-bold text-primary">100 条</strong>{' '}
              资讯，无需大模型额外猜测平台名称即可掌握全网态势。
            </div>
          </div>
        </section>

        {/* Section 3: Supported Platforms Directory */}
        <section aria-labelledby="platforms-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Cpu size={20} className="text-primary" />
            <h2 id="platforms-heading">支持的平台与分类字典</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            可以在提问中让大模型使用以下平台 ID 或分类名称进行精确过滤：
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {sectionsInfo.map((section) => (
              <div
                key={section.sectionKey}
                className="rounded-xl border border-border bg-card p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                  <code className="rounded-xs bg-muted px-1.5 py-0.5 text-[11px] font-mono text-primary">
                    {section.sectionKey}
                  </code>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {section.sources.map((source) => (
                    <span
                      key={source.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-xs text-foreground"
                    >
                      <span>{source.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({source.id})
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
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles size={20} className="text-primary" />
            <h2 id="prompts-heading">常用 AI 对话提问示例</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            配置完成后，你可以在与 AI 助手的日常对话中直接这样提问：
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {samplePrompts.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-4 space-y-2 transition-colors hover:border-primary/50"
              >
                <div className="text-xs font-semibold text-primary">{item.title}</div>
                <div className="text-xs sm:text-sm leading-6 text-foreground italic">
                  &ldquo;{item.prompt}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Direct HTTP Verification */}
        <section
          aria-labelledby="rest-heading"
          className="rounded-xl border border-border bg-muted/30 p-5 space-y-3"
        >
          <h2 id="rest-heading" className="text-sm font-semibold text-foreground">
            REST 辅助接口与调试
          </h2>
          <p className="text-xs leading-5 text-muted-foreground">
            除了标准 MCP 协议外，服务端还开放了同源只读 REST 端点，便于在浏览器或自动化脚本中测试：
          </p>
          <div className="font-mono text-xs text-foreground break-all rounded-md bg-background/90 p-3 border border-border">
            GET https://rss-api.ljhboard.cn/api/news?limit=10&platform=github
          </div>
        </section>
      </div>
    </SiteShell>
  )
}
