import { createHash } from 'node:crypto'
import { convert } from 'html-to-text'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { skillInstallCommand, skillPath, validSkillId } from '../../../../../shared/skills'
import { ArticleSummary } from '../../../components/article-summary'
import { SiteShell } from '../../../components/site-shell'
import { SkillContent, SkillInstall } from '../../../components/skill-content'
import { renderArticleContent } from '../../../lib/article-content'
import { getSkillFeeds } from '../../../lib/hot-feed'
import { createPageMetadata } from '../../../lib/seo'
import { getRelatedSkills, getSkillDetail } from '../../../lib/skill-detail'
import { parseSkillMetadata } from '../../../lib/skill-metadata'

export const revalidate = 21600
export const dynamicParams = true
export function generateStaticParams() {
  return []
}
type Props = { params: Promise<{ skillId: string[] }> }

export async function generateMetadata({ params }: Props) {
  const id = (await params).skillId.join('/')
  const detail = await getSkillDetail(id)
  if (!detail) return { title: 'Skill 未找到', robots: { index: false } }
  return {
    ...createPageMetadata({
      title: detail.name,
      description: detail.description ?? `${detail.name} 的用途与安装方式`,
      path: skillPath(id) ?? '/skills'
    }),
    robots: { index: Boolean(detail.skillMarkdown), follow: true }
  }
}

export default async function Page({ params }: Props) {
  const id = (await params).skillId.join('/')
  if (!validSkillId(id)) notFound()
  const detail = await getSkillDetail(id)
  if (!detail) notFound()
  const [feeds, related] = await Promise.all([getSkillFeeds(), getRelatedSkills(detail.source, id)])
  const allTime = feeds['skills-all-time']
  const trending = feeds['skills-trending']
  const popularItem =
    allTime.state === 'ready' ? allTime.items.find((item) => item.sourceKey === id) : null
  const trendItem =
    trending.state === 'ready' ? trending.items.find((item) => item.sourceKey === id) : null
  const installs = trendItem ? parseSkillMetadata(trendItem.summary).installs : null
  const command = skillInstallCommand(detail)
  const summaryKey = `skill:cloudflare-qwen3-30b-a3b-fp8-skill-zh-v2:${createHash('sha256')
    .update(JSON.stringify({ id, title: detail.name, content: detail.skillMarkdown }))
    .digest('hex')}`
  const headings: { id: string; text: string }[] = []
  const html = (
    detail.contentHtml ? renderArticleContent(detail.contentHtml, detail.upstreamUrl) : ''
  ).replace(/<h([2-6])>([\s\S]*?)<\/h\1>/g, (_match, level: string, text: string) => {
    const headingId = `skill-heading-${headings.length + 1}`
    headings.push({ id: headingId, text: convert(text, { wordwrap: false }) })
    return `<h${level} id="${headingId}">${text}</h${level}>`
  })
  const number = new Intl.NumberFormat('zh-CN')
  const date = (value: string) =>
    new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Shanghai'
    }).format(new Date(value))
  return (
    <SiteShell>
      <nav
        aria-label="面包屑"
        className="mb-8 flex flex-wrap gap-2 font-mono text-xs text-muted-foreground"
      >
        <Link className="transition-colors hover:text-primary" href="/">
          全部热点
        </Link>
        <span aria-hidden="true">/</span>
        <Link className="transition-colors hover:text-primary" href="/skills">
          Skills
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">
          {detail.name}
        </span>
      </nav>
      <header>
        <p className="mb-3 font-mono text-sm text-muted-foreground">{detail.source}</p>
        <h1 className="headline-display text-balance break-words text-3xl sm:text-4xl">
          {detail.name}
        </h1>
        {detail.description && (
          <p className="mt-4 max-w-3xl text-pretty text-base leading-7 text-muted-foreground">
            {detail.description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm tabular-nums">
          {detail.totalInstalls !== null && (
            <span>
              累计安装 <strong>{number.format(detail.totalInstalls)}</strong>
            </span>
          )}
          {popularItem && (
            <span>
              热门榜 <strong>#{popularItem.position}</strong>
            </span>
          )}
          {installs !== null && (
            <span>
              近 24 小时安装 <strong>{number.format(installs)}</strong>
            </span>
          )}
          {trendItem && (
            <span>
              趋势榜 <strong>#{trendItem.position}</strong>
            </span>
          )}
          {!popularItem &&
            !trendItem &&
            allTime.state === 'ready' &&
            trending.state === 'ready' && (
              <span className="text-muted-foreground">当前未进入榜单</span>
            )}
        </div>
      </header>
      {command && <SkillInstall command={command} />}
      {detail.skillMarkdown && (
        <ArticleSummary kind="skill" articleId={id} key={summaryKey} cacheKey={summaryKey} />
      )}
      <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <aside className="order-first space-y-4 self-start rounded-sm border border-border bg-card p-4 text-sm lg:order-last">
          <h2 className="border-b border-border/70 pb-2.5 font-semibold text-foreground">
            来源信息
          </h2>
          <p className="text-muted-foreground">
            {detail.sourceType === 'github' ? 'GitHub' : '网站提供'}
          </p>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            {detail.installUrl && (
              <a
                href={detail.installUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-outbound
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <span>{detail.sourceType === 'github' ? '来源仓库' : '来源网站'}</span>
                <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
              </a>
            )}
            <a
              href={detail.upstreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-outbound
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <span>skills.sh</span>
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
          </div>
          <p className="font-mono text-xs leading-6 text-muted-foreground tabular-nums">
            采集时间
            <br />
            {date(detail.contentSyncedAt ?? detail.lastSeenAt)}
          </p>
          <p className="font-mono text-xs leading-6 text-muted-foreground tabular-nums">
            本站首次收录
            <br />
            {date(detail.firstSeenAt)}
          </p>
          {headings.length > 1 && (
            <div className="border-t border-border/70 pt-3">
              <h3 className="mb-2 text-xs font-semibold text-foreground">目录</h3>
              <nav aria-label="Skill 目录">
                <ul className="space-y-1.5">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="block py-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </aside>
        <section className="min-w-0" aria-label="SKILL.md">
          {html && detail.skillMarkdown ? (
            <SkillContent html={html} markdown={detail.skillMarkdown} />
          ) : (
            <div className="rounded-sm border border-border bg-card px-5 py-8">
              <p>暂未收录 SKILL.md</p>
              <a
                className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                href={detail.upstreamUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-outbound
              >
                <span>查看来源</span>
                <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
          )}
        </section>
      </div>
      {related.length > 0 && (
        <section className="mt-12 border-t border-border pt-6">
          <h2 className="font-medium">同仓库 Skills</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.skillId}>
                <Link
                  className="inline-block min-h-11 py-2 text-primary hover:underline"
                  href={skillPath(item.skillId) ?? '/skills'}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </SiteShell>
  )
}
