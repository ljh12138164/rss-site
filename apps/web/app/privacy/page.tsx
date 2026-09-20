import { InformationPage } from '../../components/information-page'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: '隐私说明',
  description: '了解浏览 AI 热榜时的主题偏好、搜索请求及第三方链接如何处理。',
  path: '/privacy'
})

export default function PrivacyPage() {
  return (
    <InformationPage
      title="隐私说明"
      description="说明你浏览、搜索和打开原文时，哪些信息会被使用。"
    >
      <section>
        <h2>浏览本站</h2>
        <p>
          目前浏览 AI 热榜无需注册或登录，本站不要求你提供姓名、手机号或邮箱， 本站使用 Google
          AdSense 加载广告，并在配置启用时使用 Google Analytics 统计访问情况。 这些服务可能使用
          Cookie 并处理页面地址、设备及访问数据。
        </p>
      </section>
      <section>
        <h2>主题偏好保存在你的浏览器中</h2>
        <p>
          你选择的明暗主题会保存在浏览器的本地存储中，以便下次访问时沿用。
          这项设置不会作为账户资料上传；清除本站的浏览器数据后，主题会恢复为跟随系统。
        </p>
      </section>
      <section>
        <h2>搜索会发送关键词</h2>
        <p>
          使用站内搜索时，你输入的关键词和结果页码会发送给本站服务，用于查询文章标题和摘要。
          本站目前不提供个人搜索历史功能，也不将搜索词保存为个人搜索记录。
        </p>
        <p>
          搜索词会出现在请求地址中，可能随请求进入服务日志。请不要在搜索框中输入密码、
          身份证号或其他敏感信息。
        </p>
      </section>
      <section>
        <h2>访问请求与服务日志</h2>
        <p>
          加载页面和搜索结果时，提供网站运行与网络传输的服务会接收 IP 地址、请求地址、
          浏览器信息等必要的连接信息，并可能出于运行维护与安全需要记录日志。
          这与浏览器中的主题设置是不同的数据处理过程。
        </p>
      </section>
      <section>
        <h2>打开第三方原文</h2>
        <p>
          点击“继续访问”后，你会离开本站，当前标签页将打开所显示的目标地址。
          目标网站会接收你的访问请求，并按照它自己的隐私规则处理信息；
          本站的隐私说明不适用于第三方网站。
        </p>
      </section>
      <section>
        <h2>说明更新</h2>
        <p>
          如果本站的数据处理方式发生变化，我们会相应更新此页面。
          你可以随时通过页脚的“隐私说明”查看当前内容。
        </p>
        <p>
          更新日期：<time dateTime="2026-09-08">2026 年 9 月 8 日</time>
        </p>
      </section>
    </InformationPage>
  )
}
