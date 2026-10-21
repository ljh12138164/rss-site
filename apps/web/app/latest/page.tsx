import { HomeView } from '../../components/latest-overview'
import { getHomeDigest } from '../../lib/home-articles'
import { createPageMetadata, SITE_DESCRIPTION } from '../../lib/seo'

export const dynamic = 'force-static'
export const revalidate = 7200
export const metadata = {
  ...createPageMetadata({
    title: '全部热点',
    description: SITE_DESCRIPTION,
    path: '/latest'
  })
}

export default async function HomePage() {
  const digest = await getHomeDigest()
  return <HomeView digest={digest} />
}
