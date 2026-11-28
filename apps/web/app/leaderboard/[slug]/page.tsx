import { notFound } from 'next/navigation'
import { ModelDetailView } from '../../../components/leaderboard/model-detail-view'
import { SiteShell } from '../../../components/site-shell'
import { getModelDetail } from '../../../lib/leaderboard'
import {
  createModelDetailStructuredData,
  createPageMetadata,
  serializeStructuredData
} from '../../../lib/seo'
import { optionalCanonical } from '../../../lib/site-url'

export const revalidate = 14400
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const detail = await getModelDetail(slug)
  if (!detail) {
    return { title: '模型未找到', robots: { index: false } }
  }

  return {
    ...createPageMetadata({
      title: `${detail.name} 评测成绩与证据链`,
      description: `${detail.name}（${detail.creator}）综合评分 ${detail.overallScore}，包含 ${detail.evidenceSections.length} 个领域实测明细与基准成绩。`,
      path: `/leaderboard/${slug}`,
      type: 'article',
      publishedTime: detail.releasedAt || undefined
    }),
    robots: { index: true, follow: true }
  }
}

export default async function ModelPage({ params }: Props) {
  const { slug } = await params
  const detail = await getModelDetail(slug)

  if (!detail) {
    notFound()
  }

  const canonical = optionalCanonical(`/leaderboard/${slug}`)
  const description = `${detail.name}（${detail.creator}）综合评分 ${detail.overallScore}，当前排名第 ${detail.rank} 名，包含 ${detail.evidenceSections.length} 个领域实测明细与基准成绩。`
  const structuredJson = canonical
    ? serializeStructuredData(
        createModelDetailStructuredData({
          canonical,
          name: detail.name,
          creator: detail.creator,
          description,
          releasedAt: detail.releasedAt || undefined,
          modifiedAt: new Date().toISOString()
        })
      )
    : undefined

  return (
    <SiteShell>
      <ModelDetailView detail={detail} />
      {structuredJson && <script type="application/ld+json">{structuredJson}</script>}
    </SiteShell>
  )
}
