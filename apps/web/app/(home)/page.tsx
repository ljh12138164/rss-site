import { HomeDigest } from '../../components/home-digest'
import { SiteShell } from '../../components/site-shell'
import { getHomeDigest, type HomeDigest as HomeDigestData } from '../../lib/home-articles'
import {
  createHomepageStructuredData,
  createPageMetadata,
  SITE_DESCRIPTION,
  serializeStructuredData
} from '../../lib/seo'
import { optionalCanonical } from '../../lib/site-url'

export const dynamic = 'force-static'
export const revalidate = 7200
export const metadata = createPageMetadata({
  title: '今日热点 - AI、科技、新闻、财经与游戏热榜',
  description: SITE_DESCRIPTION,
  path: '/'
})

export function HomeView({ digest }: { digest: HomeDigestData }) {
  const canonical = optionalCanonical('/')
  const structuredJson = canonical
    ? serializeStructuredData(createHomepageStructuredData(canonical))
    : undefined

  return (
    <SiteShell mainClassName="pt-8 sm:pt-10">
      <header className="border-b border-border pb-7 sm:pb-9">
        <p className="eyebrow">每日聚合 · RSS Digest</p>
        <h1 className="headline-display mt-3 text-[2.625rem] leading-[1.08] sm:text-6xl">
          今日热点
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
          每日聚合 AI、科技、新闻、社交、财经与游戏热点，一眼看全，按分区深入。
        </p>
      </header>
      <HomeDigest digest={digest} />
      {structuredJson && <script type="application/ld+json">{structuredJson}</script>}
    </SiteShell>
  )
}

export default async function HomePage() {
  const digest = await getHomeDigest()
  return <HomeView digest={digest} />
}
