import { Cpu } from 'lucide-react'
import { ModelLeaderboard } from '../../components/leaderboard/model-leaderboard'
import { TranslatedText } from '../../components/site-language'
import { SiteShell } from '../../components/site-shell'
import {
  buildLeaderboardFaqItems,
  getModelLeaderboard,
  type ModelLeaderboardItem
} from '../../lib/leaderboard'
import {
  createLeaderboardStructuredData,
  createPageMetadata,
  serializeStructuredData
} from '../../lib/seo'
import { optionalCanonical } from '../../lib/site-url'

export const dynamic = 'force-static'
export const revalidate = 14400

export const metadata = createPageMetadata({
  title: 'AI 模型评测排行榜',
  description:
    '前沿大模型能力排行榜，涵盖代码编程、科研推理、办公 Agent 与知识问答等细分维度的公开基准评测。',
  path: '/leaderboard'
})

export function LeaderboardHeader({ updatedDate }: { updatedDate?: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-2.5">
        <Cpu className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <h1 className="headline-display text-2xl text-foreground sm:text-3xl">
          <TranslatedText id="leaderboard.pageTitle" />
        </h1>
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        <TranslatedText id="leaderboard.updatedEvery4h" />
        {updatedDate ? (
          <>
            {' · '}
            <TranslatedText id="leaderboard.updatedAtLabel" /> {updatedDate}
          </>
        ) : null}
      </span>
    </header>
  )
}

export default async function LeaderboardPage() {
  const categoriesData: Record<string, ModelLeaderboardItem[]> = {}

  const [overall, coding, reasoning, professional, knowledge] = await Promise.all([
    getModelLeaderboard('overall'),
    getModelLeaderboard('coding'),
    getModelLeaderboard('reasoning'),
    getModelLeaderboard('professional'),
    getModelLeaderboard('knowledge')
  ])

  categoriesData.overall = overall
  categoriesData.coding = coding
  categoriesData.reasoning = reasoning
  categoriesData.professional = professional
  categoriesData.knowledge = knowledge

  const now = new Date()
  const updatedAt = now.toISOString()
  const updatedDate = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
  const faqItems = buildLeaderboardFaqItems(categoriesData, updatedDate)
  const canonical = optionalCanonical('/leaderboard')
  const structuredJson = canonical
    ? serializeStructuredData(
        createLeaderboardStructuredData({
          canonical,
          updatedAt,
          models: overall,
          faqItems
        })
      )
    : undefined

  return (
    <SiteShell>
      <LeaderboardHeader updatedDate={updatedDate} />
      <ModelLeaderboard categories={categoriesData} />
      {faqItems.length > 0 && (
        <section
          aria-labelledby="leaderboard-faq-heading"
          className="mt-10 border-t border-border pt-6"
        >
          <h2 id="leaderboard-faq-heading" className="text-base font-semibold text-foreground">
            <TranslatedText id="leaderboard.faqHeading" />
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-sm border border-border bg-card p-4">
                <dt className="text-sm font-semibold leading-6 text-foreground">{item.question}</dt>
                <dd className="mt-1.5 text-xs leading-6 text-muted-foreground sm:text-sm">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {structuredJson && <script type="application/ld+json">{structuredJson}</script>}
    </SiteShell>
  )
}
