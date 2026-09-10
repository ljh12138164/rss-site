import { describe, expect, it } from 'vitest'
import { parseGitHubRepository } from './github-repository'

describe('parseGitHubRepository', () => {
  it('extracts repository identity and trailing RSSHub metrics', () => {
    expect(
      parseGitHubRepository({
        author: 'sudheerj',
        title: 'sudheerj/reactjs-interview-questions',
        url: 'https://github.com/sudheerj/reactjs-interview-questions',
        summary:
          'List of top 500 ReactJS Interview Questions. Language: JavaScript Stars: 44,795 Forks: 10,384'
      })
    ).toEqual({
      avatarUrl: 'https://github.com/sudheerj.png?size=80',
      description: 'List of top 500 ReactJS Interview Questions.',
      forks: 10384,
      language: 'JavaScript',
      name: 'reactjs-interview-questions',
      owner: 'sudheerj',
      stars: 44795
    })
  })

  it('does not invent missing metrics or construct an unsafe avatar URL', () => {
    expect(
      parseGitHubRepository({
        author: '../unsafe',
        title: '一个开源项目',
        url: 'https://example.com/project',
        summary: '中文项目简介'
      })
    ).toEqual({
      avatarUrl: null,
      description: '中文项目简介',
      forks: null,
      language: null,
      name: '一个开源项目',
      owner: null,
      stars: null
    })
  })
})
