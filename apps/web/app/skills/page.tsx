import { SiteShell } from '../../components/site-shell'
import { SkillLeaderboard } from '../../components/skill-leaderboard'
import { getSkillFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata = createPageMetadata({
  title: '热门 Skills',
  description: '查看 skills.sh 当前最热门和增长最快的 Agent Skills。',
  path: '/skills'
})

export function SkillsHeader() {
  return (
    <header className="mb-8 sm:mb-10">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <span aria-hidden="true" className="font-mono text-xs font-bold tracking-tight">
          SK
        </span>
      </div>
      <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
        热门 Skills
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
        浏览 skills.sh 上最热门和增长最快的 Agent Skills。榜单每 6 小时更新。
      </p>
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
