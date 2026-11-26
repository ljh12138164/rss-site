import { ArrowDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { InformationPage } from '../../components/information-page'
import { UiText } from '../../components/site-language'
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
        <h2>
          <UiText>{'收录范围'}</UiText>
        </h2>
        <p>
          <UiText>
            {
              '汇总 35 个以上公开平台与官方博客，覆盖 AI、科技、国内新闻、社交、财经与游戏六个频道， 以及开源排行与 Skills 榜单。站内提供原文跳转、中文翻译、要点总结与 RSS 订阅。'
            }
          </UiText>
        </p>
      </section>
      <section aria-labelledby="content-flow-heading">
        <h2 id="content-flow-heading">
          <UiText>{'运作方式'}</UiText>
        </h2>
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
                <span>
                  <UiText>{title}</UiText>
                </span>
                {index < 3 && (
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-auto hidden size-4 shrink-0 text-muted-foreground sm:block"
                  />
                )}
              </div>
              <div className="mt-1.5 text-xs leading-5 text-muted-foreground">
                <UiText>{detail}</UiText>
              </div>
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
          <UiText>{'查看数据流图'}</UiText>
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </section>
      <section>
        <h2>
          <UiText>{'版权与时效'}</UiText>
        </h2>
        <p>
          <UiText>
            {
              '标题、摘要与正文来自各平台公开页面，版权归原作者及对应平台所有。站内保留出处与原文链接； 抓取按固定间隔执行，存在同步延迟，内容若被原站修改或撤回，以原站为准。'
            }
          </UiText>
        </p>
      </section>
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">
          <UiText>{'常见问题'}</UiText>
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              <UiText>{'内容多久更新一次？'}</UiText>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <UiText>
                {
                  'AI 核心来源（OpenAI、Anthropic、DeepSeek、Google AI、智谱 GLM、Qwen 等）每 2 小时检查更新； 科技、新闻、社交、财经、游戏与 Skills 榜单每 6 小时同步一次。'
                }
              </UiText>
            </p>
          </div>
          <div id="rss">
            <h3 className="text-sm font-semibold text-foreground">
              <UiText>{'如何通过 RSS 订阅？'}</UiText>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <UiText>
                {
                  '可在顶部「RSS」弹窗复制全站或分频道的 RSS 2.0 地址（如 /feeds/ai.xml），粘贴到阅读器使用。AI 客户端可接入'
                }
              </UiText>{' '}
              <Link className="text-primary underline underline-offset-4" href="/mcp">
                <UiText>{'MCP 接口'}</UiText>
              </Link>
              <UiText>{'。'}</UiText>
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2>
          <UiText>{'访问与隐私'}</UiText>
        </h2>
        <p>
          <UiText>{'浏览无需登录。数据处理与外链跳转规则见'}</UiText>{' '}
          <Link className="text-primary underline underline-offset-4" href="/privacy">
            <UiText>{'隐私说明'}</UiText>
          </Link>{' '}
          <UiText>{'与'}</UiText>{' '}
          <Link className="text-primary underline underline-offset-4" href="/privacy#terms">
            <UiText>{'服务条款'}</UiText>
          </Link>
          <UiText>{'。'}</UiText>
        </p>
      </section>
      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">
          <UiText>{'反馈与联系'}</UiText>
        </h2>
        <p>
          <UiText>{'由'}</UiText>{' '}
          <a
            className="text-primary underline underline-offset-4"
            href="https://blog.ljhboard.cn/"
            rel="author"
          >
            LJH
          </a>{' '}
          <UiText>{'维护。链接失效、排版异常或信源增补反馈，请提交到'}</UiText>{' '}
          <a
            className="text-primary underline underline-offset-4"
            href="https://github.com/ljh12138164/rss-site/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub Issues
          </a>
          <UiText>{'。'}</UiText>
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          <UiText>{'最近更新：'}</UiText>
          <time dateTime="2026-10-23">
            <UiText>{'2026 年 10 月 23 日'}</UiText>
          </time>
        </p>
      </section>
    </InformationPage>
  )
}
