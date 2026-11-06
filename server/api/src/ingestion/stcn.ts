import { load } from 'cheerio'
import { XMLBuilder } from 'fast-xml-parser'
import { fetchSignalFeed } from './fetch'

const origin = 'https://www.stcn.com'
const listUrl = `${origin}/article/list/yw.html`

export async function fetchStcnFeed(): Promise<string> {
  const $ = load(await fetchSignalFeed(listUrl, { timeoutMs: 10_000 }))
  const links = [
    ...new Set(
      $('ul.infinite-list li div.tt a')
        .toArray()
        .map((element) => new URL($(element).attr('href') ?? '', origin))
        .filter(
          (url) => url.origin === origin && /^\/article\/detail\/\d+\.html$/.test(url.pathname)
        )
        .map((url) => url.href)
    )
  ].slice(0, 30)
  if (!links.length) throw new Error('STCN article list is empty or has changed')

  // Fetch three articles at a time, keeping request pressure below the list size.
  const items = []
  for (let offset = 0; offset < links.length; offset += 3) {
    items.push(
      ...(await Promise.all(
        links.slice(offset, offset + 3).map(async (link) => {
          const detail = load(await fetchSignalFeed(link, { timeoutMs: 10_000 }))
          const title = detail('div.detail-title').text().trim()
          const content = detail('div.detail-content').first()
          if (!title || !content.text().trim()) throw new Error('STCN article content is missing')
          content.find('script, style').remove()
          content.find('img').each((_, element) => {
            const image = detail(element)
            const src = image.attr('src') || image.attr('data-src')
            if (src) image.attr('src', new URL(src, link).href)
          })
          const time = detail('div.detail-info span')
            .toArray()
            .map((element) => detail(element).text().trim())
            .find((value) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/.test(value))
          const publishedAt = time ? new Date(`${time.replace(' ', 'T')}+08:00`) : undefined
          return {
            title,
            link,
            guid: link,
            ...(publishedAt && !Number.isNaN(publishedAt.getTime())
              ? { pubDate: publishedAt.toUTCString() }
              : {}),
            author: detail('div.detail-info span')
              .toArray()
              .map((element) => detail(element).text().trim())
              .find((value) => value.startsWith('作者：'))
              ?.replace(/^作者：/, ''),
            'content:encoded': { '#cdata': content.html() ?? '' }
          }
        })
      ))
    )
  }
  return new XMLBuilder({ ignoreAttributes: false, cdataPropName: '#cdata' }).build({
    rss: {
      '@_version': '2.0',
      '@_xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
      channel: { title: '证券时报要闻', link: listUrl, item: items }
    }
  })
}
