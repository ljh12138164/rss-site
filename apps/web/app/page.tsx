import { ArrowRight, RadioTower } from 'lucide-react'
import Link from 'next/link'
import { FeedResultView } from '../components/feed-result'
import { FeedStatus } from '../components/feed-status'
import { SiteShell } from '../components/site-shell'
import { type FeedResult, getJuejinFeed } from '../lib/hot-feed'

export const dynamic = 'force-dynamic'

export function HomeView({ feed }: { feed: FeedResult }) {
  return (
    <SiteShell>
      <section className="pb-20 sm:pb-24">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <RadioTower aria-hidden="true" className="size-3.5" />
          Signal archive
        </p>
        <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.16] tracking-[-0.045em] sm:text-5xl">
          热点跟踪
        </h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
          定时整理开发者社区正在讨论的内容。沿着信号阅读，不被信息流推着走。
        </p>
        <div className="mt-10" role="img" aria-label="约每五小时采集一次">
          <div className="grid grid-cols-5 gap-2" aria-hidden="true">
            {['00', '05', '10', '15', '20'].map((hour) => (
              <span
                className="border-t border-primary/70 pt-2 font-mono text-[0.625rem] text-muted-foreground"
                key={hour}
              >
                {hour}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="technology">
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">01 / 科技</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">掘金</h2>
          </div>
          <Link
            className="group flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            href="/technology/juejin"
          >
            查看完整榜单
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {feed.state === 'ready' ? (
          <div className="mb-5">
            <FeedStatus {...feed.status} />
          </div>
        ) : null}
        <FeedResultView feed={feed} />
      </section>
    </SiteShell>
  )
}

export default async function HomePage() {
  return <HomeView feed={await getJuejinFeed(5)} />
}
