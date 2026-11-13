import { HomeView } from '../components/latest-overview'
import { getHomeHubData } from '../lib/home-hub'
import {
  createHomepageStructuredData,
  createPageMetadata,
  SITE_ALTERNATE_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  serializeStructuredData
} from '../lib/seo'
import { optionalCanonical } from '../lib/site-url'

export const dynamic = 'force-dynamic'
export const revalidate = 7200

export const metadata = {
  ...createPageMetadata({
    title: `${SITE_NAME}（${SITE_ALTERNATE_NAME}）`,
    description: SITE_DESCRIPTION,
    path: '/'
  }),
  alternates: optionalCanonical('/') ? { canonical: '/' } : undefined
}

export default async function HomePage() {
  const { digest, dailyReport, topModels } = await getHomeHubData()
  const canonical = optionalCanonical('/')

  return (
    <>
      <HomeView digest={digest} dailyReport={dailyReport} topModels={topModels} />
      {canonical && (
        <script type="application/ld+json">
          {serializeStructuredData(createHomepageStructuredData(canonical))}
        </script>
      )}
    </>
  )
}
