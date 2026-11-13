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
    <InformationPage title="关于 AI 热榜" description="多平台公开资讯与技术动态聚合站。">
      <section>
        <h2>收录范围</h2>
        <p>
          汇总 35 个以上公开平台与官方博客，覆盖 AI、科技、国内新闻、社交、财经与游戏六个频道，
          以及开源排行与 Skills 榜单。站内提供原文跳转、中文翻译、要点总结与 RSS 订阅。
        </p>
      </section>
      <section aria-labelledby="content-flow-heading">
        <h2 id="content-flow-heading">运作方式</h2>
        <ol className="my-4 grid gap-3 sm:grid-cols-4">
          {[
            ['公开信源', '官方 RSS 与公开榜单'],
            ['定时抓取', '提取标题、链接与发布时间'],
            ['归档入库', '去重整理并更新热点流'],
            ['阅读订阅', '搜索、阅读或 RSS / MCP 获取']
          ].map(([title, detail], index) => (
            <li className="min-w-0 rounded-sm border border-border bg-secondary p-3" key={title}>
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
              <div className="mt-1.5 text-xs leading-5 text-muted-foreground">{detail}</div>
              {index < 3 && (
                <ArrowDown
                  aria-hidden="true"
                  className="mt-2 size-4 text-muted-foreground sm:hidden"
                />
              )}
            </li>
          ))}
        </ol>
        <a
          className="inline-flex min-h-10 items-center gap-2 text-sm text-primary underline underline-offset-4"
          href="/diagrams/content-flow.html"
        >
          查看数据流图
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </section>
      <section>
        <h2>版权与时效</h2>
        <p>
          标题、摘要与正文来自各平台公开页面，版权归原作者及对应平台所有。站内保留出处与原文链接；
          抓取按固定间隔执行，存在同步延迟，内容若被原站修改或撤回，以原站为准。
        </p>
      </section>
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">常见问题</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">内容多久更新一次？</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AI 核心来源（OpenAI、Anthropic、DeepSeek、Google AI、智谱 GLM、Qwen 等）每 2
              小时检查更新； 科技、新闻、社交、财经、游戏与 Skills 榜单每 6 小时同步一次。
            </p>
          </div>
          <div id="rss">
            <h3 className="text-sm font-semibold text-foreground">如何通过 RSS 订阅？</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              可在顶部「RSS」弹窗复制全站或分频道的 RSS 2.0 地址（如
              /feeds/ai.xml），粘贴到阅读器使用； AI 客户端可通过{' '}
              <Link className="text-primary underline underline-offset-4" href="/mcp">
                MCP 接口
              </Link>{' '}
              接入。
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2>访问与隐私</h2>
        <p>
          浏览无需登录。数据处理与外链跳转规则见{' '}
          <Link className="text-primary underline underline-offset-4" href="/privacy">
            隐私说明
          </Link>{' '}
          与{' '}
          <Link className="text-primary underline underline-offset-4" href="/privacy#terms">
            服务条款
          </Link>
          。
        </p>
      </section>
      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">反馈与联系</h2>
        <p>
          由{' '}
          <a
            className="text-primary underline underline-offset-4"
            href="https://blog.ljhboard.cn/"
            rel="author"
          >
            LJH
          </a>{' '}
          维护。链接失效、排版异常或信源增补反馈，请提交到{' '}
          <a
            className="text-primary underline underline-offset-4"
            href="https://github.com/ljh12138164/rss-site/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub Issues
          </a>
          。
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          最近更新：<time dateTime="2026-10-23">2026 年 10 月 23 日</time>
        </p>
      </section>
    </InformationPage>
  )
}
