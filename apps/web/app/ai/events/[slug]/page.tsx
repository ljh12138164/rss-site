import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventSources } from '../../../../components/event-sources'
import { EventTranslation } from '../../../../components/event-translation'
import { TranslatedText } from '../../../../components/site-language'
import { SiteShell } from '../../../../components/site-shell'
import { getEvent, getEventSources, getRelatedEvents } from '../../../../lib/ai-events'
import { looksLikeEnglish } from '../../../../lib/article-language'
import {
  createEventStructuredData,
  createPageMetadata,
  serializeStructuredData,
  toMetaDescription
} from '../../../../lib/seo'
import { optionalCanonical } from '../../../../lib/site-url'
import { aiSources } from '../../../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 7200
export const dynamicParams = true
export function generateStaticParams() {
  return []
}
type Props = { params: Promise<{ slug: string }> }
async function resolve(params: Props['params']) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()
  return event
}
export async function generateMetadata({ params }: Props) {
  const event = await resolve(params)
  return createPageMetadata({
    title: event.title,
    description: toMetaDescription(event.summary) ?? event.title,
    path: `/ai/events/${event.slug}`,
    type: 'article',
    publishedTime: event.first_published_at,
    modifiedTime: event.updated_at
  })
}
export default async function EventPage({ params }: Props) {
  const event = await resolve(params)
  const links = await getEventSources(event.id)
  const related = await getRelatedEvents(
    event.id,
    links.map((link) => link.signal_articles.id)
  )
  const canonical = optionalCanonical(`/ai/events/${event.slug}`)
  const language = looksLikeEnglish(`${event.title}\n${event.summary}`) ? 'en' : 'zh-CN'
  const structuredJson = canonical
    ? serializeStructuredData(
        createEventStructuredData({
          canonical,
          title: event.title,
          description: event.summary,
          publishedAt: event.first_published_at,
          modifiedAt: event.updated_at,
          language,
          citations: links.map((link) => link.signal_articles.url)
        })
      )
    : undefined
  return (
    <SiteShell>
      <Link className="inline-flex min-h-11 items-center text-sm text-primary" href="/ai/events">
        <TranslatedText id="events.backToTimeline" />
      </Link>
      <article className="mt-6 max-w-3xl">
        <EventSources sources={links.map((link) => link.signal_articles.source)} />
        <EventTranslation
          slug={event.slug}
          title={event.title}
          summary={event.summary}
          canTranslate={language === 'en'}
          dateTime={event.occurred_at}
        />
        <section className="mt-10 border-t border-border pt-7">
          <h2 className="text-lg font-semibold">
            <TranslatedText id="events.relatedSources" />
          </h2>
          {links.length ? (
            <ol className="mt-3 divide-y divide-border">
              {links.map(({ signal_articles: article }) => (
                <li key={article.id} className="py-4">
                  <p className="mb-2 text-xs text-muted-foreground">
                    {aiSources.find((source) => source.id === article.source)?.name ??
                      article.source}
                  </p>
                  <a
                    className="break-words text-primary hover:underline"
                    href={article.url}
                    target="_blank"
                    rel="noreferrer noopener external"
                    data-outbound
                  >
                    {article.title}
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              <TranslatedText id="events.noRelatedSources" />
            </p>
          )}
        </section>
        {related.length > 0 && (
          <section className="mt-10 border-t border-border pt-7">
            <h2 className="text-lg font-semibold">
              <TranslatedText id="events.relatedEvents" />
            </h2>
            <ul className="mt-3 space-y-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link className="text-primary hover:underline" href={`/ai/events/${item.slug}`}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
      {structuredJson && <script type="application/ld+json">{structuredJson}</script>}
    </SiteShell>
  )
}
