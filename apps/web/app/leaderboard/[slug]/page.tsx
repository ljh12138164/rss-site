import { notFound } from 'next/navigation'
import { ModelDetailView } from '../../../components/leaderboard/model-detail-view'
import { SiteShell } from '../../../components/site-shell'
import { getModelDetail } from '../../../lib/leaderboard'
import { createPageMetadata } from '../../../lib/seo'

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
      path: `/leaderboard/${slug}`
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

  return (
    <SiteShell>
      <ModelDetailView detail={detail} />
    </SiteShell>
  )
}
