// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { SkillFeeds } from '../lib/hot-feed'
import { SkillLeaderboard } from './skill-leaderboard'

let root: Root
let container: HTMLDivElement

const sampleFeeds: SkillFeeds = {
  'skills-all-time': {
    state: 'ready',
    status: {
      itemCount: 2,
      lastSuccessAt: new Date('2026-11-22T09:40:00Z')
    },
    items: [
      {
        sourceKey: 'vercel-labs/skills/find-skills',
        title: '#1 find-skills',
        url: 'https://skills.sh/vercel-labs/skills/find-skills',
        summary:
          'Helps users discover and install agent skills when they ask questions like "how do I do X" or express interest in extending capabilities. · Installs: 4,488,225 · Source: vercel-labs/skills',
        author: 'vercel-labs',
        publishedAt: null,
        position: 1
      },
      {
        sourceKey: 'vercel-labs/agent-browser/agent-browser',
        title: '#2 agent-browser',
        url: 'https://skills.sh/vercel-labs/agent-browser/agent-browser',
        summary: `${'Browser automation CLI for AI agents. '.repeat(25)}· Installs: 1,642,371 · Source: vercel-labs/agent-browser`,
        author: 'vercel-labs',
        publishedAt: null,
        position: 2
      }
    ]
  },
  'skills-trending': {
    state: 'ready',
    status: {
      itemCount: 1,
      lastSuccessAt: new Date('2026-11-22T09:50:00Z')
    },
    items: [
      {
        sourceKey: 'heygen-com/hyperframes/hyperframes-cli',
        title: '#1 hyperframes-cli',
        url: 'https://skills.sh/heygen-com/hyperframes/hyperframes-cli',
        summary: 'HyperFrames CLI without installs metadata · Source: heygen-com/hyperframes',
        author: 'heygen-com',
        publishedAt: null,
        position: 1
      }
    ]
  }
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sessionStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('renders fixed-height clamped rows in list view and switches to fixed-height cards', async () => {
  await act(async () => root.render(<SkillLeaderboard feeds={sampleFeeds} />))

  const listItems = Array.from(container.querySelectorAll('ol > li'))
  expect(listItems).toHaveLength(2)
  for (const li of listItems) {
    expect(li.className).toContain('h-32')
    expect(li.className).toContain('sm:h-[6.25rem]')
  }

  const listDesc = listItems[1].querySelector('.line-clamp-2')
  expect(listDesc).toBeTruthy()
  expect(listDesc?.className).not.toContain('block')

  const cardsBtn = Array.from(container.querySelectorAll('button')).find(
    (node) => node.textContent === '卡片'
  )
  expect(cardsBtn).toBeTruthy()
  await act(async () => cardsBtn?.click())

  const cardItems = Array.from(container.querySelectorAll('ol > li'))
  expect(cardItems).toHaveLength(2)
  for (const li of cardItems) {
    expect(li.className).toContain('h-[12rem]')
  }

  const cardDesc = cardItems[1].querySelector('.line-clamp-3')
  expect(cardDesc).toBeTruthy()
  expect(cardDesc?.className).not.toContain('block')
  expect(cardItems[0].textContent).toContain('4,488,225')
  expect(cardItems[0].textContent).toContain('总计')
  expect(cardItems[0].textContent).toContain('vercel-labs/skills')
})
