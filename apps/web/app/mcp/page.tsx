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
import { TranslatedText } from '../../components/site-language'
import { McpPlatformDescription } from '../../components/site-rich-text'
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
    titleId: 'sections.technology.mcpTitle',
    sectionKey: 'technology',
    sources: technologySources
  },
  {
    titleId: 'sections.ai.mcpTitle',
    sectionKey: 'ai',
    sources: aiSources
  },
  {
    titleId: 'sections.social.mcpTitle',
    sectionKey: 'social',
    sources: socialSources
  },
  {
    titleId: 'sections.news.mcpTitle',
    sectionKey: 'news',
    sources: newsSources
  },
  {
    titleId: 'sections.finance.mcpTitle',
    sectionKey: 'finance',
    sources: financeSources
  },
  {
    titleId: 'sections.games.mcpTitle',
    sectionKey: 'games',
    sources: gameSources
  },
  {
    titleId: 'sections.skills.mcpTitle',
    sectionKey: 'skills',
    sources: skillSources
  }
] as const

const samplePrompts = [
  { titleId: 'mcp.promptMorningTitle', promptId: 'mcp.promptMorningBody' },
  { titleId: 'mcp.promptTechTitle', promptId: 'mcp.promptTechBody' },
  { titleId: 'mcp.promptAiTitle', promptId: 'mcp.promptAiBody' },
  { titleId: 'mcp.promptFinanceTitle', promptId: 'mcp.promptFinanceBody' }
] as const

export default function McpPage() {
  return (
    <SiteShell mainClassName="mx-auto w-full max-w-4xl">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="headline-display text-balance text-3xl text-foreground sm:text-4xl">
          <TranslatedText id="mcp.title" />
        </h1>
        <p className="mt-2.5 text-pretty text-sm leading-6 text-muted-foreground">
          <TranslatedText id="mcp.subtitle" />
        </p>
      </header>

      <div className="space-y-10">
        {/* Section 1: Client Config */}
        <section aria-labelledby="client-config-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Terminal size={18} className="text-primary" />
            <h2 id="client-config-heading">
              <TranslatedText id="mcp.clientSetup" />
            </h2>
          </div>
          <McpClientConfig />
        </section>

        {/* Section 2: Tool Specification */}
        <section aria-labelledby="tool-spec-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Wrench size={18} className="text-primary" />
            <h2 id="tool-spec-heading">
              <TranslatedText id="mcp.toolRef" />
            </h2>
          </div>

          <div className="space-y-4 rounded-sm border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-bold text-primary">get_news</span>
              <span className="rounded-sm bg-primary/14 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                MCP Tool
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              <TranslatedText id="mcp.toolDesc" />
            </p>

            {/* Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-xs text-muted-foreground">
                    <th className="py-2.5 font-medium">
                      <TranslatedText id="mcp.colParam" />
                    </th>
                    <th className="py-2.5 font-medium">
                      <TranslatedText id="mcp.colType" />
                    </th>
                    <th className="py-2.5 font-medium">
                      <TranslatedText id="mcp.colRequired" />
                    </th>
                    <th className="py-2.5 font-medium">
                      <TranslatedText id="mcp.colDefault" />
                    </th>
                    <th className="py-2.5 font-medium">
                      <TranslatedText id="mcp.colDesc" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 font-mono font-semibold text-foreground">platform</td>
                    <td className="py-3 font-mono text-muted-foreground">string</td>
                    <td className="py-3 text-muted-foreground">
                      <TranslatedText id="mcp.no" />
                    </td>
                    <td className="py-3 text-muted-foreground">
                      <TranslatedText id="mcp.allPlatforms" />
                    </td>
                    <td className="py-3 text-muted-foreground">
                      <McpPlatformDescription />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono font-semibold text-foreground">limit</td>
                    <td className="py-3 font-mono text-muted-foreground">number</td>
                    <td className="py-3 text-muted-foreground">
                      <TranslatedText id="mcp.no" />
                    </td>
                    <td className="py-3 font-mono font-semibold text-primary">100</td>
                    <td className="py-3 text-muted-foreground">
                      <TranslatedText id="mcp.limitDesc" />
                    </td>
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
            <h2 id="platforms-heading">
              <TranslatedText id="mcp.platformsHeading" />
            </h2>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {sectionsInfo.map((section) => (
              <div
                key={section.sectionKey}
                className="space-y-2.5 rounded-sm border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    <TranslatedText id={section.titleId} />
                  </h3>
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
            <h2 id="prompts-heading">
              <TranslatedText id="mcp.promptsHeading" />
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {samplePrompts.map((item) => (
              <div
                key={item.titleId}
                className="space-y-1.5 rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary/45"
              >
                <div className="font-mono text-xs font-semibold text-primary">
                  <TranslatedText id={item.titleId} />
                </div>
                <div className="text-xs leading-6 text-foreground sm:text-sm">
                  &ldquo;
                  <TranslatedText id={item.promptId} />
                  &rdquo;
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  )
}
