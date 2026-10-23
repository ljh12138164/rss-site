import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import AboutPage from './about/page'
import HomePage from './page'
import PrivacyPage from './privacy/page'

vi.mock('../components/theme-toggle', () => ({ ThemeToggle: () => null }))
vi.mock('../components/site-header', () => ({ SiteHeader: () => null }))
vi.mock('../components/outbound-dialog', () => ({ OutboundDialog: () => null }))

it('provides the approved homepage, reading entry and six section destinations', () => {
  const html = renderToStaticMarkup(<HomePage />)
  expect(html).toContain('今天的热点，在这里看')
  expect(html).toContain('href="/latest"')
  for (const section of ['ai', 'technology', 'news', 'social', 'finance', 'games']) {
    expect(html).toContain(`href="/${section}"`)
  }
  expect(html).toContain('href="/github"')
  expect(html).toContain('href="/ai/openai"')
  expect(html).toContain('href="/social/zhihu"')
  expect(html).toContain('href="/about#rss"')
  expect(html).toContain('已配置来源数')
  expect(html).toContain('不代表实时热度或文章数量')
  expect(html).not.toContain('今日速览')
})

it('includes GEO signals: 350+ server-rendered words, question headings, citations, table, author byline, dates, and policy links', () => {
  const html = renderToStaticMarkup(<HomePage />)
  const plainText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = plainText.split(' ')

  expect(words.length).toBeGreaterThanOrEqual(350)
  expect(html).toContain('内容从哪里来，怎么核对原文出处？')
  expect(html).toContain('怎么按兴趣筛选，把好文章留着慢慢读？')
  expect(html).toContain('各分区的收录规模与更新频率是多少？')
  expect(html).toContain('常见问题：今日热点怎么用？')
  expect(html).toContain('<table class="home-spec-table">')
  expect(html).toContain('<blockquote cite="https://www.rssboard.org/rss-specification"')
  expect(html).toContain('<cite>')
  expect(html).toContain('rel="author"')
  expect(html).toContain('dateTime="2026-09-01"')
  expect(html).toContain('dateTime="2026-10-23"')
  expect(html).toContain('href="/about#contact"')
  expect(html).toContain('href="/privacy#terms"')

  const aboutHtml = renderToStaticMarkup(<AboutPage />)
  expect(aboutHtml).toContain('id="contact"')
  expect(aboutHtml).toContain('href="/about#contact"')

  const privacyHtml = renderToStaticMarkup(<PrivacyPage />)
  expect(privacyHtml).toContain('id="terms"')
  expect(privacyHtml).toContain('href="/privacy#terms"')
})
