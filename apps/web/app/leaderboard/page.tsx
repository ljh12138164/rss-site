import { Cpu } from 'lucide-react'
import { ModelLeaderboard } from '../../components/leaderboard/model-leaderboard'
import { SiteShell } from '../../components/site-shell'
import { getModelLeaderboard, type ModelLeaderboardItem } from '../../lib/leaderboard'
import { createPageMetadata } from '../../lib/seo'

export const dynamic = 'force-static'
export const revalidate = 14400

export const metadata = createPageMetadata({
  title: 'AI 模型评测排行榜',
  description:
    '前沿大模型能力排行榜，涵盖代码编程、科研推理、办公 Agent 与知识问答等细分维度的公开基准评测。',
  path: '/leaderboard'
})

export function LeaderboardHeader() {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-2.5">
        <Cpu className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <h1 className="headline-display text-2xl text-foreground sm:text-3xl">AI 模型评测榜</h1>
      </div>
      <span className="font-mono text-xs text-muted-foreground">每 4 小时更新</span>
    </header>
  )
}

export default async function LeaderboardPage() {
  const categoriesData: Record<string, ModelLeaderboardItem[]> = {}

  const [overall, coding, reasoning, professional, knowledge] = await Promise.all([
    getModelLeaderboard('overall'),
    getModelLeaderboard('coding'),
    getModelLeaderboard('reasoning'),
    getModelLeaderboard('professional'),
    getModelLeaderboard('knowledge')
  ])

  categoriesData.overall = overall
  categoriesData.coding = coding
  categoriesData.reasoning = reasoning
  categoriesData.professional = professional
  categoriesData.knowledge = knowledge

  return (
    <SiteShell>
      <LeaderboardHeader />
      <ModelLeaderboard categories={categoriesData} />
    </SiteShell>
  )
}
