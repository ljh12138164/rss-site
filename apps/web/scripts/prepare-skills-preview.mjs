import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { populateSkillDetail } from './skill-preview-detail.mjs'

const apiRequire = createRequire(new URL('../../../server/api/package.json', import.meta.url))
const rssRequire = createRequire(new URL('../../../../RSSHub/package.json', import.meta.url))
const { XMLParser } = apiRequire('fast-xml-parser')
const { decodeHTML } = rssRequire('entities')
const MarkdownIt = rssRequire('markdown-it')
const md = new MarkdownIt({ html: false, linkify: true })
const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (_name, path) => path === 'rss.channel.item'
})
const details = new Map()
const items = []
const statuses = []
const now = new Date().toISOString()
try {
  process.loadEnvFile(
    fileURLToPath(new URL('../../../../RSSHub/.env.skills-preview.local', import.meta.url))
  )
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const token = process.env.VERCEL_OIDC_TOKEN
if (!token)
  throw new Error(
    'Refresh Vercel OIDC with vercel env pull .env.skills-preview.local in the RSSHub project'
  )
for (const view of ['all-time', 'trending']) {
  const response = await fetch(`https://rss.ljhboard.cn/skills-sh/${view}`, {
    signal: AbortSignal.timeout(60000)
  })
  if (!response.ok) throw new Error(`Feed ${view}: ${response.status}`)
  const rows = parser.parse(await response.text()).rss.channel.item
  statuses.push({ source: `skills-${view}`, item_count: rows.length, last_success_at: now })
  rows.forEach((row, index) => {
    const id = typeof row.guid === 'object' ? row.guid['#text'] : row.guid
    const paragraphs = [...row.description.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((part) =>
      decodeHTML(part[1].replace(/<[^>]*>/g, ''))
    )
    const value = (label) =>
      paragraphs
        .find((part) => part.startsWith(`${label}:`))
        ?.slice(label.length + 1)
        .trim()
    const source = value('Source')
    const type = value('Source type')
    const description = paragraphs[0]?.startsWith('Rank:') ? null : paragraphs[0]
    const count = Number(value('Installs')?.replaceAll(',', ''))
    const installUrl = row.description.match(/<a href="([^"]+)">Source repository/)?.[1] ?? null
    const item = {
      source: `skills-${view}`,
      source_key: id,
      title: row.title,
      url: row.link,
      summary: `${description ?? ''} · Installs: ${count} · Source: ${source} · Source type: ${type}`,
      author: source.split('/')[0],
      published_at: null,
      position: index + 1
    }
    items.push(item)
    const previous = details.get(id)
    details.set(id, {
      skillId: id,
      name: row.title.replace(/^#\d+\s+/, ''),
      source,
      sourceType: type,
      upstreamUrl: row.link,
      installUrl,
      description,
      totalInstalls: view === 'all-time' ? count : (previous?.totalInstalls ?? null),
      skillMarkdown: null,
      contentHtml: null,
      contentHash: null,
      detailState: 'missing',
      firstSeenAt: now,
      lastSeenAt: now,
      contentSyncedAt: null
    })
  })
}
// The leaderboard RSS is generated from the official API; retrieve complete snapshots by stable ID.
const candidates = [...details.values()]
let ready = 0
for (let offset = 0; offset < candidates.length; offset += 5) {
  await Promise.all(
    candidates.slice(offset, offset + 5).map(async (detail) => {
      await populateSkillDetail(detail, { token, renderMarkdown: (text) => md.render(text), now })
      if (detail.detailState === 'ready') ready++
    })
  )
  console.log(
    `Skills preview: ${Math.min(offset + 5, candidates.length)}/${candidates.length}, ${ready} full documents`
  )
}
const path = fileURLToPath(new URL('../.skills-preview.json', import.meta.url))
await writeFile(path, JSON.stringify({ details: [...details.values()], items, statuses }))
console.log(`Saved ${details.size} real Skills from the official API; ${ready} include SKILL.md`)
