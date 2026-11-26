import { InformationPage } from '../../components/information-page'
import { TranslatedText } from '../../components/site-language'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: '隐私说明',
  description: '了解浏览 AI 热榜时的主题偏好、搜索请求及第三方链接如何处理。',
  path: '/privacy'
})

export default function PrivacyPage() {
  return (
    <InformationPage titleId="privacy.title" descriptionId="privacy.subtitle">
      <section>
        <h2>
          <TranslatedText id="privacy.noAccountHeading" />
        </h2>
        <p>
          <TranslatedText id="privacy.noAccountBody" />
        </p>
      </section>
      <section>
        <h2>
          <TranslatedText id="privacy.localStorageHeading" />
        </h2>
        <p>
          <TranslatedText id="privacy.localStorageBody" />
        </p>
      </section>
      <section>
        <h2>
          <TranslatedText id="privacy.siteSearchHeading" />
        </h2>
        <p>
          <TranslatedText id="privacy.siteSearchBody" />
        </p>
      </section>
      <section>
        <h2>
          <TranslatedText id="privacy.accessLogsHeading" />
        </h2>
        <p>
          <TranslatedText id="privacy.accessLogsBody" />
        </p>
      </section>
      <section>
        <h2>
          <TranslatedText id="privacy.externalLinksHeading" />
        </h2>
        <p>
          <TranslatedText id="privacy.externalLinksBody" />
        </p>
      </section>
      <section id="terms" aria-labelledby="terms-heading">
        <h2 id="terms-heading">
          <TranslatedText id="privacy.termsHeading" />
        </h2>
        <p>
          <TranslatedText id="privacy.termsBody1" />
        </p>
        <p>
          <TranslatedText id="privacy.termsBody2" />
        </p>
        <p>
          <TranslatedText id="privacy.termsBody3" />
        </p>
      </section>
      <section>
        <h2>
          <TranslatedText id="privacy.revisionsHeading" />
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          <TranslatedText id="privacy.updatedLabel" />
          <time dateTime="2026-10-23">
            <TranslatedText id="privacy.updatedDateValue" />
          </time>
        </p>
      </section>
    </InformationPage>
  )
}
