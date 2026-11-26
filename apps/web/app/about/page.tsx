import { ArrowDown, ArrowRight } from 'lucide-react'
import { InformationPage } from '../../components/information-page'
import { TranslatedText } from '../../components/site-language'
import {
  AboutContactNotice,
  AboutPrivacyNotice,
  AboutRssAnswer
} from '../../components/site-rich-text'
import { createPageMetadata } from '../../lib/seo'

export const metadata = createPageMetadata({
  title: '关于本站',
  description: '了解 AI 热榜的内容来源、阅读方式与 RSS 订阅。',
  path: '/about'
})

const HOW_IT_WORKS_STEPS = [
  ['about.step1Title', 'about.step1Detail'],
  ['about.step2Title', 'about.step2Detail'],
  ['about.step3Title', 'about.step3Detail'],
  ['about.step4Title', 'about.step4Detail']
] as const

export default function AboutPage() {
  return (
    <InformationPage titleId="about.title" descriptionId="about.subtitle">
      <section>
        <h2>
          <TranslatedText id="about.coverageHeading" />
        </h2>
        <p>
          <TranslatedText id="about.coverageBody" />
        </p>
      </section>
      <section aria-labelledby="content-flow-heading">
        <h2 id="content-flow-heading">
          <TranslatedText id="about.howItWorksHeading" />
        </h2>
        <ol className="my-4 grid gap-3 sm:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map(([titleId, detailId], index) => (
            <li className="min-w-0 rounded-sm border border-border bg-secondary p-3" key={titleId}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="font-mono text-xs text-primary">{index + 1}</span>
                <span>
                  <TranslatedText id={titleId} />
                </span>
                {index < 3 && (
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-auto hidden size-4 shrink-0 text-muted-foreground sm:block"
                  />
                )}
              </div>
              <div className="mt-1.5 text-xs leading-5 text-muted-foreground">
                <TranslatedText id={detailId} />
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
          <TranslatedText id="about.viewFlowDiagram" />
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </section>
      <section>
        <h2>
          <TranslatedText id="about.copyrightHeading" />
        </h2>
        <p>
          <TranslatedText id="about.copyrightBody" />
        </p>
      </section>
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">
          <TranslatedText id="about.faqHeading" />
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              <TranslatedText id="about.faqFrequencyQ" />
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <TranslatedText id="about.faqFrequencyA" />
            </p>
          </div>
          <div id="rss">
            <h3 className="text-sm font-semibold text-foreground">
              <TranslatedText id="about.faqRssQ" />
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <AboutRssAnswer />
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2>
          <TranslatedText id="about.privacyHeading" />
        </h2>
        <p>
          <AboutPrivacyNotice />
        </p>
      </section>
      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">
          <TranslatedText id="about.contactHeading" />
        </h2>
        <p>
          <AboutContactNotice />
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          <TranslatedText id="about.lastUpdated" />
          <time dateTime="2026-10-23">
            <TranslatedText id="about.updatedDateValue" />
          </time>
        </p>
      </section>
    </InformationPage>
  )
}
