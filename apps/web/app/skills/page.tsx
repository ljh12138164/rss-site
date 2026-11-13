import { Boxes } from 'lucide-react'
import { SiteShell } from '../../components/site-shell'
import { SkillLeaderboard } from '../../components/skill-leaderboard'
import { getSkillFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 21600

export const metadata = createPageMetadata({
  title: '热门 Skills',
  description: '查看 skills.sh 当前最热门和增长最快的 Agent Skills。',
  path: '/skills'
})

export function SkillsHeader() {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-2.5">
        <Boxes className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <h1 className="headline-display text-2xl text-foreground sm:text-3xl">热门 Skills</h1>
      </div>
      <span className="font-mono text-xs text-muted-foreground">skills.sh · 每 6 小时更新</span>
    </header>
  )
}

export default async function SkillsPage() {
  const feeds = await getSkillFeeds()
  return (
    <SiteShell>
      <SkillsHeader />
      <SkillLeaderboard feeds={feeds} />
    </SiteShell>
  )
}
