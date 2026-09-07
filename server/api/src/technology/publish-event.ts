import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import postgres from 'postgres'

// Editorial input is supplied by a person; this command never generates event content.
async function main() {
  const path = process.argv[2]
  if (!path || !process.env.DATABASE_URL)
    throw new Error('Provide an event JSON file and DATABASE_URL')
  const input = JSON.parse(await readFile(path, 'utf8'))
  const archive = input.status === 'archived'
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (
    input.slug !== undefined &&
    (typeof input.slug !== 'string' || input.slug.length > 200 || !slugPattern.test(input.slug))
  )
    throw new Error('Invalid slug')
  if (archive && !input.slug) throw new Error('Archiving requires an existing slug')
  if (
    !archive &&
    (typeof input.title !== 'string' ||
      !input.title.trim() ||
      typeof input.summary !== 'string' ||
      !input.summary.trim() ||
      !Number.isFinite(Date.parse(input.occurredAt)) ||
      !Array.isArray(input.articleIds) ||
      !input.articleIds.length ||
      input.articleIds.length > 100 ||
      !input.articleIds.every(
        (id: unknown) =>
          typeof id === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)
      ))
  )
    throw new Error('Publishing requires title, summary, occurredAt and 1–100 articleIds')
  if (input.status !== undefined && input.status !== 'published' && !archive)
    throw new Error('Invalid status')
  const readable = archive
    ? ''
    : input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60)
        .replace(/-$/, '') || 'ai-event'
  const slug: string = input.slug ?? `${readable}-${randomUUID().slice(0, 8)}`
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 10 })
  try {
    await sql.begin(async (tx) => {
      const existing = await tx`select id from public.ai_events where slug=${slug} for update`
      if (input.slug && !existing.length)
        throw new Error('Event does not exist; omit slug to create one')
      if (archive) {
        const archived =
          await tx`update public.ai_events set status='archived' where slug=${slug} and first_published_at is not null returning id`
        if (!archived.length) throw new Error('Only previously published events can be archived')
        return
      }
      const ids = [...new Set<string>(input.articleIds)]
      const articles =
        await tx`select id from public.signal_articles where section='ai' and id in ${tx(ids)} for share`
      if (articles.length !== ids.length)
        throw new Error('Every source article must exist in the AI section')
      const rows = existing.length
        ? await tx`update public.ai_events set title=${input.title.trim()},summary=${input.summary.trim()},occurred_at=${new Date(input.occurredAt).toISOString()},status='published',first_published_at=coalesce(first_published_at,now()) where slug=${slug} returning id`
        : await tx`insert into public.ai_events(slug,title,summary,occurred_at,status,first_published_at) values(${slug},${input.title.trim()},${input.summary.trim()},${new Date(input.occurredAt).toISOString()},'published',now()) returning id`
      const eventId = rows[0].id
      const currentLinks =
        await tx`select article_id from public.ai_event_articles where event_id=${eventId} order by position`
      if (
        currentLinks.length !== ids.length ||
        currentLinks.some((link, index) => link.article_id !== ids[index])
      ) {
        await tx`delete from public.ai_event_articles where event_id=${eventId}`
        for (const [index, id] of ids.entries())
          await tx`insert into public.ai_event_articles(event_id,article_id,position) values(${eventId},${id},${index + 1})`
      }
    })
    // Publication failure does not roll back successfully stored editorial work.
    let publication = 'disabled'
    if (process.env.WEB_APP_URL || process.env.REVALIDATE_SECRET) {
      publication = 'failed'
      if (process.env.WEB_APP_URL && process.env.REVALIDATE_SECRET) {
        try {
          const response = await fetch(new URL('/api/revalidate', process.env.WEB_APP_URL), {
            method: 'POST',
            redirect: 'error',
            headers: {
              Authorization: `Bearer ${process.env.REVALIDATE_SECRET}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ events: [slug] }),
            signal: AbortSignal.timeout(5000)
          })
          if (
            response.ok &&
            ((await response.json()) as { revalidated?: boolean }).revalidated === true
          )
            publication = 'revalidated'
        } catch {
          /* Retry the protected revalidation endpoint after configuration/network recovery. */
        }
      }
    }
    console.log(JSON.stringify({ slug, status: archive ? 'archived' : 'published', publication }))
    if (publication === 'failed') process.exitCode = 1
  } finally {
    await sql.end()
  }
}

main().catch(() => {
  console.error(
    'Event publication failed. Check the input, linked articles and server configuration.'
  )
  process.exitCode = 1
})
