import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { GithubRankingHeader } from './page'

it('presents GitHub Trending as an independent Chinese ranking', () => {
  const html = renderToStaticMarkup(<GithubRankingHeader />)

  expect(html).toContain('开源排行')
  expect(html).toContain('GitHub Trending 中文项目周榜')
  expect(html).toContain('Stars')
  expect(html).toContain('Forks')
  expect(html).not.toContain('科技')
})
