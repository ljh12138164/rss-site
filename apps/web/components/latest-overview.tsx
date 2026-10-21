import type { HomeDigest as HomeDigestData } from '../lib/home-articles'
import { HomeDigest } from './home-digest'
import { SiteShell } from './site-shell'

export function HomeView({ digest }: { digest: HomeDigestData }) {
  return (
    <SiteShell mainClassName="pt-8 sm:pt-10">
      <header className="border-b border-border pb-7 sm:pb-9">
        <h1 className="headline-display mt-3 text-[2.625rem] leading-[1.08] sm:text-6xl">
          今日热点
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
          汇集 AI、科技、新闻、社交、财经与游戏热点。
        </p>
      </header>
      <HomeDigest digest={digest} />
    </SiteShell>
  )
}
