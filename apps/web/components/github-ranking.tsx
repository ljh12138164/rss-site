import Link from 'next/link'
import type { FeedResult } from '../lib/hot-feed'
import { FeedResultView } from './feed-result'

export function GithubRanking({ feed }: { feed: FeedResult }) {
  return (
    <section aria-label="开源排行榜" className="mt-8 min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">开源排行榜</h3>
        <Link
          className="min-h-11 content-center text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          href="/technology/github"
        >
          GitHub Trending · 周榜
        </Link>
      </div>
      <FeedResultView feed={feed} source="github" returnTo="/technology" />
    </section>
  )
}
