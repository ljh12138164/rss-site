import { getDailyReport } from './daily-reports'
import { getHomeDigest } from './home-articles'
import { getModelLeaderboard } from './leaderboard'

export async function getHomeHubData() {
  const [digest, dailyReport, topModels] = await Promise.all([
    getHomeDigest(),
    getDailyReport().catch(() => null),
    getModelLeaderboard('overall').catch(() => [])
  ])
  return { digest, dailyReport, topModels }
}
