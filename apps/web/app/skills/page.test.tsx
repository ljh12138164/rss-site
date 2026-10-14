import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { SkillsHeader } from './page'

it('introduces the two skills.sh ranking views', () => {
  const html = renderToStaticMarkup(<SkillsHeader />)
  expect(html).toContain('热门 Skills')
  expect(html).toContain('skills.sh 榜单')
  expect(html).toContain('每 6 小时更新')
})
