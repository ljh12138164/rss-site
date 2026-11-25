import { describe, expect, it } from 'vitest'
import {
  aiSources,
  financeSources,
  gameSources,
  getSignalSection,
  getSignalSource,
  isSignalSectionId,
  isSignalSourceId,
  listSignalSections,
  listSignalSources,
  newsSources,
  resolveSignalFeedUrl,
  resolveSignalFeedUrls,
  SIGNAL_CRON_JOBS,
  signalSections,
  signalSources,
  skillSources,
  socialSources,
  technologyArticleSources,
  technologySources
} from './index.js'

describe('@rss-site/signals', () => {
  it('defines 7 sections and 122 sources', () => {
    expect(signalSections).toHaveLength(7)
    expect(listSignalSections()).toHaveLength(7)
    expect(signalSources).toHaveLength(122)
    expect(SIGNAL_CRON_JOBS).toHaveLength(122)
  })

  it('correctly maps all section counts', () => {
    expect(technologySources).toHaveLength(41)
    expect(technologyArticleSources).toHaveLength(40)
    expect(skillSources).toHaveLength(2)
    expect(newsSources).toHaveLength(8)
    expect(aiSources).toHaveLength(29)
    expect(socialSources).toHaveLength(12)
    expect(financeSources).toHaveLength(12)
    expect(gameSources).toHaveLength(18)
  })

  it('retrieves source and section by id', () => {
    const gh = getSignalSource('github')
    expect(gh.name).toBe('GitHub Trending')
    expect(gh.isArticle).toBe(false)
    expect(gh.section).toBe('technology')

    const tech = getSignalSection('technology')
    expect(tech.title).toBe('科技')
    expect(tech.path).toBe('/technology')

    expect(() => getSignalSource('nonexistent')).toThrow('Unknown signal source')
    expect(() => getSignalSection('nonexistent')).toThrow('Unknown signal section')
  })

  it('validates source and section ids', () => {
    expect(isSignalSourceId('openai')).toBe(true)
    expect(isSignalSourceId('geekpark')).toBe(true)
    expect(isSignalSourceId('lilian-weng')).toBe(true)
    expect(isSignalSourceId('simon-willison')).toBe(true)
    expect(isSignalSourceId('cohere')).toBe(true)
    expect(isSignalSourceId('minimax')).toBe(true)
    expect(isSignalSourceId('kimi')).toBe(true)
    expect(isSignalSourceId('vllm')).toBe(true)
    expect(isSignalSourceId('modal')).toBe(true)
    expect(isSignalSourceId('elevenlabs')).toBe(true)
    expect(isSignalSourceId('sierra')).toBe(true)
    expect(isSignalSourceId('apple-ml')).toBe(true)
    expect(isSignalSourceId('together')).toBe(true)
    expect(isSignalSourceId('rust-blog')).toBe(true)
    expect(isSignalSourceId('ruanyifeng')).toBe(true)
    expect(isSignalSourceId('chrome')).toBe(true)
    expect(isSignalSourceId('propublica')).toBe(true)
    expect(isSignalSourceId('grist')).toBe(true)
    expect(isSignalSourceId('ifanr')).toBe(true)
    expect(isSignalSourceId('appinn')).toBe(true)
    expect(isSignalSourceId('solidot')).toBe(true)
    expect(isSignalSourceId('lifehacker')).toBe(true)
    expect(isSignalSourceId('torrentfreak')).toBe(true)
    expect(isSignalSourceId('daring-fireball')).toBe(true)
    expect(isSignalSourceId('fortune')).toBe(true)
    expect(isSignalSourceId('dl-news')).toBe(true)
    expect(isSignalSourceId('marginal-revolution')).toBe(true)
    expect(isSignalSourceId('ritholtz')).toBe(true)
    expect(isSignalSourceId('abnormal-returns')).toBe(true)
    expect(isSignalSourceId('of-dollars-and-data')).toBe(true)
    expect(isSignalSourceId('unchained')).toBe(true)
    expect(isSignalSourceId('aftermath')).toBe(true)
    expect(isSignalSourceId('ars-gaming')).toBe(true)
    expect(isSignalSourceId('rpgfan')).toBe(true)
    expect(isSignalSourceId('playstation-lifestyle')).toBe(true)
    expect(isSignalSourceId('overkill')).toBe(true)
    expect(isSignalSourceId('chuapp')).toBe(true)
    expect(isSignalSourceId('80lv')).toBe(true)
    expect(isSignalSourceId('invalid')).toBe(false)
    expect(isSignalSectionId('ai')).toBe(true)
    expect(isSignalSectionId('invalid')).toBe(false)
  })

  it('filters sources by section and isArticle', () => {
    const techArticles = listSignalSources({ section: 'technology', isArticle: true })
    expect(techArticles).toHaveLength(40)
    expect(techArticles.some((s) => s.id === 'github')).toBe(false)

    const allSkills = listSignalSources({ section: 'skills' })
    expect(allSkills).toHaveLength(2)
  })

  it('resolves feed urls correctly', () => {
    const rsshubSource = getSignalSource('hacker-news')
    expect(resolveSignalFeedUrl(rsshubSource, 'https://rsshub.app')).toBe(
      'https://rsshub.app/hackernews'
    )

    expect(resolveSignalFeedUrl(getSignalSource('metr'), 'https://rsshub.app')).toBe(
      'https://metr.org/feed.xml'
    )
    expect(resolveSignalFeedUrls(getSignalSource('ars-technica'), 'https://rsshub.app')).toEqual([
      'https://arstechnica.com/information-technology/feed/',
      'https://arstechnica.com/ai/feed/'
    ])

    expect(resolveSignalFeedUrl(getSignalSource('groq'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/groq/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('cohere'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/cohere/blog?limit=20'
    )
    expect(resolveSignalFeedUrl(getSignalSource('minimax'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/minimax/blog?limit=20'
    )
    expect(resolveSignalFeedUrl(getSignalSource('80lv'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/80lv/articles?limit=30'
    )
    expect(resolveSignalFeedUrl(getSignalSource('kimi'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/kimi/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('vllm'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/vllm/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('modal'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/modal/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('elevenlabs'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/elevenlabs/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('sierra'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/sierra/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('apple-ml'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/apple/ml-research'
    )
    expect(resolveSignalFeedUrl(getSignalSource('together'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/together/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('chinatalk'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/substack/subscribe/chinatalk'
    )
    expect(resolveSignalFeedUrl(getSignalSource('aws-ml'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/amazon/blogs/machine-learning'
    )
    expect(resolveSignalFeedUrl(getSignalSource('import-ai'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/substack/subscribe/importai'
    )
    expect(resolveSignalFeedUrl(getSignalSource('dwarkesh'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/substack/subscribe/dwarkesh'
    )

    const directSource = getSignalSource('github-blog')
    expect(resolveSignalFeedUrl(directSource, 'https://rsshub.app')).toBe(
      'https://github.blog/feed/'
    )
    expect(resolveSignalFeedUrl(getSignalSource('antigravity'), 'https://rsshub.app')).toBe(
      'https://rsshub.app/google/antigravity/blog/zh-CN'
    )
    expect(
      resolveSignalFeedUrl(getSignalSource('cloudflare-blog'), 'https://rss.ljhboard.cn')
    ).toBe('https://rss.ljhboard.cn/cloudflare/blog')
    expect(resolveSignalFeedUrl(getSignalSource('rust-blog'), 'https://rss.ljhboard.cn')).toBe(
      'https://blog.rust-lang.org/feed.xml'
    )
    expect(resolveSignalFeedUrl(getSignalSource('go-blog'), 'https://rss.ljhboard.cn')).toBe(
      'https://go.dev/blog/feed.atom'
    )
    expect(resolveSignalFeedUrl(getSignalSource('netflix-tech'), 'https://rss.ljhboard.cn')).toBe(
      'https://netflixtechblog.com/feed'
    )
    expect(resolveSignalFeedUrl(getSignalSource('ruanyifeng'), 'https://rss.ljhboard.cn')).toBe(
      'https://www.ruanyifeng.com/blog/atom.xml'
    )
    expect(resolveSignalFeedUrl(getSignalSource('chrome'), 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/chrome/blog'
    )
    expect(resolveSignalFeedUrl(getSignalSource('propublica'), 'https://rss.ljhboard.cn')).toBe(
      'https://www.propublica.org/feeds/propublica/main'
    )
    expect(resolveSignalFeedUrl(getSignalSource('ifanr'), 'https://rss.ljhboard.cn')).toBe(
      'https://www.ifanr.com/feed'
    )
    expect(resolveSignalFeedUrl(getSignalSource('fortune'), 'https://rss.ljhboard.cn')).toBe(
      'https://fortune.com/feed/'
    )
    expect(resolveSignalFeedUrl(getSignalSource('aftermath'), 'https://rss.ljhboard.cn')).toBe(
      'https://aftermath.site/feed'
    )
  })

  it('groups only Chinese NVIDIA and AMD feeds under two technology platforms', () => {
    expect(resolveSignalFeedUrls(getSignalSource('nvidia'), 'https://rss.ljhboard.cn')).toEqual([
      'https://rss.ljhboard.cn/nvidia/developer/zh-CN?limit=20',
      'https://blogs.nvidia.cn/feed/'
    ])
    expect(resolveSignalFeedUrls(getSignalSource('amd'), 'https://rss.ljhboard.cn')).toEqual([
      'https://rss.ljhboard.cn/amd/newsroom/all/zh-CN?limit=20'
    ])
    expect(resolveSignalFeedUrls(getSignalSource('arm'), 'https://rss.ljhboard.cn')).toEqual([
      'https://rss.ljhboard.cn/arm/news?limit=20',
      'https://rss.ljhboard.cn/arm/blog?limit=20'
    ])
    expect(resolveSignalFeedUrls(getSignalSource('minimax'), 'https://rss.ljhboard.cn')).toEqual([
      'https://rss.ljhboard.cn/minimax/blog?limit=20',
      'https://rss.ljhboard.cn/minimax/news?limit=20'
    ])
    expect(
      resolveSignalFeedUrls(getSignalSource('github-blog'), 'https://rss.ljhboard.cn')
    ).toEqual(['https://github.blog/feed/'])
  })

  it('merges OpenAI news and developers blog feeds under the openai source', () => {
    const openai = getSignalSource('openai')
    expect(openai.itemLimit).toBe(30)
    expect(resolveSignalFeedUrl(openai, 'https://rss.ljhboard.cn')).toBe(
      'https://rss.ljhboard.cn/openai/news?limit=20'
    )
    expect(resolveSignalFeedUrls(openai, 'https://rss.ljhboard.cn')).toEqual([
      'https://rss.ljhboard.cn/openai/news?limit=20',
      'https://rss.ljhboard.cn/openai/developers/blog?limit=20'
    ])
  })

  it('schedules each signal every six hours in a distinct minute', () => {
    const schedules = new Set<string>()
    for (const job of SIGNAL_CRON_JOBS) {
      expect(job.name).toMatch(/^signal-ingest-[a-z0-9-]+$/)
      expect(job.schedule).toMatch(/^(?:\d|[1-5]\d) [0-5](?:,\d{1,2}){3} \* \* \*$/)
      const hours = job.schedule.split(' ')[1].split(',').map(Number)
      expect(hours).toEqual([0, 6, 12, 18].map((offset) => hours[0] + offset))
      expect(schedules.has(job.schedule)).toBe(false)
      schedules.add(job.schedule)
    }
  })
})
