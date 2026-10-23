import { ArrowDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { InformationPage } from '../../components/information-page'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: '关于本站',
  description: '了解 AI 热榜的内容来源、阅读方式与 RSS 订阅。',
  path: '/about'
})

export default function AboutPage() {
  return (
    <InformationPage
      title="关于 AI 热榜"
      description="把分散的动态放在一起，让你更快找到想读的内容。"
    >
      <section>
        <h2>在这里读什么</h2>
        <p>
          今日热点（AI 热榜）是一个专注
          AI、科技、国内新闻、社交、财经和游戏六大维度的轻量化热点聚合与 RSS 订阅平台。 平台汇总 35+
          官方订阅与公开媒体源，你可以浏览最新文章，按来源查看动态，也可以搜索标题和摘要，找到感兴趣的话题。
        </p>
      </section>
      <section aria-labelledby="content-flow-heading">
        <h2 id="content-flow-heading">本站如何运作</h2>
        <p>定期把公开来源的内容整理到一起，你看到的是已保存的文章列表。</p>
        <ol className="my-5 grid gap-3 sm:grid-cols-4">
          {[
            ['公开内容', '官方订阅源或 RSSHub'],
            ['定期获取', '提取标题、链接与时间'],
            ['整理保存', '更新文章与当前列表'],
            ['阅读与订阅', '浏览、搜索或使用 RSS']
          ].map(([title, detail], index) => (
            <li className="min-w-0" key={title}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="font-mono text-xs text-primary">{index + 1}</span>
                <span>{title}</span>
                {index < 3 && (
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-auto hidden size-4 shrink-0 text-muted-foreground sm:block"
                  />
                )}
              </div>
              <div className="mt-2 text-xs leading-6 text-muted-foreground">{detail}</div>
              {index < 3 && (
                <ArrowDown
                  aria-hidden="true"
                  className="mt-3 size-4 text-muted-foreground sm:hidden"
                />
              )}
            </li>
          ))}
        </ol>
        <a
          className="inline-flex min-h-11 items-center gap-2 text-sm text-primary underline underline-offset-4"
          href="/diagrams/content-flow.html"
        >
          查看原理图
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </section>
      <section>
        <h2>内容从哪里来</h2>
        <p>
          标题、摘要和文章内容来自公开网页或订阅源，相关权利归原作者及所属平台所有。
          本站保留来源和原文链接，方便你继续阅读和核对信息。
        </p>
        <p>
          分区列表按发布时间展示，列表序号表示阅读顺序。来源更新可能存在延迟，
          内容也可能被原站修改或撤回，请以原文为准。
        </p>
      </section>
      <section id="rss">
        <h2>继续阅读，或订阅更新</h2>
        <p>
          外部文章会先显示离站提示，确认地址后点击“继续访问”，即可在当前标签页打开原文。
          新闻文章也可以在站内阅读，并通过原文链接查看出处。
        </p>
        <p>
          六个分区都提供 RSS 订阅入口。进入你关心的分区，复制 RSS 地址到阅读器，
          就能用习惯的方式接收更新。
        </p>
      </section>
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">常见问题</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">什么是今日热点？</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              今日热点（AI 热榜）是一个多平台公开内容聚合站，覆盖
              AI、科技、国内新闻、社交、财经与游戏 6 个阅读分区及 Skills
              榜单，把分散在官方博客与媒体站点的动态整理到一起，保留原始出处、发布时间与原文链接。
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">内容更新频率是怎样的？</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              站点采用定时错峰拉取机制，并非实时流式抓取。AI
              专区的核心模型来源（OpenAI、ChatGPT、Anthropic、DeepSeek、Google AI、智谱 GLM、Qwen
              等）每 2 小时检查一次更新；科技、国内新闻、社交热点、财经、游戏与 Skills 榜单每 6
              小时同步一次。
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">如何使用 RSS 订阅本站？</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AI、科技、国内新闻、社交、财经、游戏六个分区均提供标准 RSS 2.0 订阅地址（例如
              /feeds/ai.xml），也可以在「我的关注」页面生成自定义来源组合的 RSS
              链接，粘贴到任意阅读器即可按周期接收更新。
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2>访问与隐私</h2>
        <p>
          浏览本站无需注册。关于主题偏好、搜索请求、外部链接与使用规则的说明，参见
          <Link className="text-primary underline underline-offset-4" href="/privacy">
            隐私说明
          </Link>
          与
          <Link className="text-primary underline underline-offset-4" href="/privacy#terms">
            服务条款
          </Link>
          。
        </p>
      </section>
      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">联系我们</h2>
        <p>
          本站由{' '}
          <a
            className="text-primary underline underline-offset-4"
            href="https://blog.ljhboard.cn/"
            rel="author"
          >
            LJH
          </a>{' '}
          维护。如果发现来源链接失效、抓取排版异常，或有信源增补与内容权利相关反馈，可通过{' '}
          <a
            className="text-primary underline underline-offset-4"
            href="https://github.com/ljh12138164/rss-site/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub Issues
          </a>{' '}
          或作者博客留言联系。
        </p>
        <p>
          最近更新：<time dateTime="2026-10-23">2026 年 10 月 23 日</time>
        </p>
      </section>
    </InformationPage>
  )
}
