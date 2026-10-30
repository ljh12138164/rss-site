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
    <header className="mb-8 sm:mb-10">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
        <Cpu className="size-5" />
      </div>
      <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
        AI 模型评测榜
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
        汇集公开标准化评测集与人类盲测成绩，涵盖编程、科研、办公 Agent 与知识问答等维度，每 4
        小时更新。
      </p>
    </header>
  )
}

export default async function LeaderboardPage() {
  const categoriesData: Record<string, ModelLeaderboardItem[]> = {}

  // Fetch overall and category rankings in parallel
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
