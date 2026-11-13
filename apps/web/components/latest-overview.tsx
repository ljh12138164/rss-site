import type { DailyReport } from '../../../shared/daily-report'
import type { HomeDigest } from '../lib/home-articles'
import type { ModelLeaderboardItem } from '../lib/leaderboard'
import { HomeDigestView } from './home-digest'
import { SiteShell } from './site-shell'

export function HomeView({
  digest,
  dailyReport,
  topModels
}: {
  digest: HomeDigest
  dailyReport?: DailyReport | null
  topModels?: ModelLeaderboardItem[]
}) {
  return (
    <SiteShell>
      <HomeDigestView digest={digest} dailyReport={dailyReport} topModels={topModels} />
    </SiteShell>
  )
}
