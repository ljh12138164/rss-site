import { HomeView } from '../../components/latest-overview'
import { getHomeHubData } from '../../lib/home-hub'
import { createPageMetadata, SITE_DESCRIPTION } from '../../lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 7200
export const metadata = {
  ...createPageMetadata({
    title: '全部热点',
    description: SITE_DESCRIPTION,
    path: '/latest'
  })
}

export default async function LatestHomePage() {
  const { digest, dailyReport, topModels } = await getHomeHubData()
  return <HomeView digest={digest} dailyReport={dailyReport} topModels={topModels} />
}
