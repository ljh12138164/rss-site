import { InformationPage } from '../../components/information-page'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: '隐私说明',
  description: '了解浏览 AI 热榜时的主题偏好、搜索请求及第三方链接如何处理。',
  path: '/privacy'
})

export default function PrivacyPage() {
  return (
    <InformationPage title="隐私说明" description="浏览、搜索及点击外部链接时的数据处理方式。">
      <section>
        <h2>无账号浏览</h2>
        <p>
          本站无需注册或登录，不收集姓名、手机号或邮箱。页面启用 Google AdSense 广告与 Google
          Analytics 访问统计时，相关脚本会通过 Cookie 处理设备与访问信息。
        </p>
      </section>
      <section>
        <h2>本地偏好与阅读记录</h2>
        <p>
          明暗主题、关注来源、稍后读与最近 100
          条浏览记录仅保存在你的浏览器本地存储中，不会上传到服务器；清除浏览器数据后主题恢复默认深色。
        </p>
      </section>
      <section>
        <h2>站内搜索</h2>
        <p>
          搜索关键词与页码会发送给后端用于匹配标题与摘要，不在个人账号下保存历史。关键词会出现在请求日志中，请勿输入密码或敏感信息。
        </p>
      </section>
      <section>
        <h2>访问日志</h2>
        <p>服务器与网络传输节点会接收必要的 IP、请求路径与浏览器信息，用于安全防护和排查故障。</p>
      </section>
      <section>
        <h2>外部链接</h2>
        <p>在离站提示中点击“继续访问”后，浏览器将跳转到第三方原站并受对方隐私政策约束。</p>
      </section>
      <section id="terms" aria-labelledby="terms-heading">
        <h2 id="terms-heading">服务条款</h2>
        <p>
          站内展示的标题、摘要与正文均来自公开页面与订阅源，著作权归原作者及原平台所有，本站保留署名与原始链接。
        </p>
        <p>
          数据按定时任务同步，可能落后于原站更新；译文与 AI
          总结由模型生成，仅作辅助阅读，事实以原站原文为准。
        </p>
        <p>
          RSS 订阅（/feeds/*.xml）、llms.txt 与 MCP
          接口仅供个人阅读与常规频率工具调用，请勿高频并发抓取。
        </p>
      </section>
      <section>
        <h2>修订记录</h2>
        <p className="font-mono text-xs text-muted-foreground">
          更新日期：<time dateTime="2026-10-23">2026 年 10 月 23 日</time>
        </p>
      </section>
    </InformationPage>
  )
}
