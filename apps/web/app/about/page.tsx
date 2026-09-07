import type { Metadata } from 'next'
import Link from 'next/link'
import { InformationPage } from '../../components/information-page'

export const metadata: Metadata = {
  title: '关于本站',
  description: '了解 AI 热榜的内容来源、阅读方式与 RSS 订阅。'
}

export default function AboutPage() {
  return (
    <InformationPage
      title="关于 AI 热榜"
      description="把分散的动态放在一起，让你更快找到想读的内容。"
    >
      <section>
        <h2>在这里读什么</h2>
        <p>
          AI 热榜汇集 AI、科技、新闻、社交、财经和游戏六个分区的公开内容。你可以浏览最新文章，
          按来源查看动态，也可以搜索标题和摘要，找到感兴趣的话题。
        </p>
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
      <section>
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
      <section>
        <h2>访问与隐私</h2>
        <p>
          浏览本站无需注册。关于主题偏好、搜索请求和外部链接的数据处理，参见
          <Link className="text-primary underline underline-offset-4" href="/privacy">
            隐私说明
          </Link>
          。
        </p>
      </section>
    </InformationPage>
  )
}
