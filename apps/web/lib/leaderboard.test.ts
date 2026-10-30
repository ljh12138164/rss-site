import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getModelDetail, getModelLeaderboard } from './leaderboard'

const MOCK_LEADERBOARD_JSON = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'AIHOT 前沿大模型评测综合榜',
  home_page_url: 'https://aihot.news/leaderboard',
  items: [
    {
      id: 'aihot:leaderboard:overall:gemini-4-carbon:1',
      url: 'https://aihot.news/leaderboard/gemini-4-carbon',
      title: '[No.1 评分: 75.2] Gemini 4 Carbon · Google',
      content_html: `<div>
        <p><strong>榜单名次：</strong>第 1 名<br>
        <strong>AIHOT 评分：</strong>75.2<br>
        <strong>评测覆盖：</strong>17 项评测 · 覆盖率 47%</p>
        <p><strong>五大领域分项分：</strong><br>编程：73.1分 (第2名) · 科研：76.6分 (第1名) · 专业办公：76.6分 (第1名) · 知识问答：76.0分 (第1名)</p>
        <p><strong>API 参考价格：</strong>暂无官方按量价格</p>
      </div>`,
      date_published: '2026-10-28T00:00:00.000Z',
      tags: ['综合榜', 'Google']
    },
    {
      id: 'aihot:leaderboard:overall:gpt-6-terra:10',
      url: 'https://aihot.news/leaderboard/gpt-6-terra',
      title: '[No.10 评分: 68.2] GPT-6.1 Terra · OpenAI',
      content_html: `<div>
        <p><strong>榜单名次：</strong>第 10 名<br>
        <strong>AIHOT 评分：</strong>68.2<br>
        <strong>评测覆盖：</strong>21 项评测 · 覆盖率 53%</p>
        <p><strong>五大领域分项分：</strong><br>编程：67.8分 (第10名) · 科研：72.9分 (第6名)</p>
        <p><strong>API 参考价格：</strong>缓存: ¥0.33 / 输入: ¥6.66 / 输出: ¥33.31 (每百万 Token)</p>
      </div>`,
      date_published: '2026-10-26T00:00:00.000Z',
      tags: ['综合榜', 'OpenAI']
    }
  ]
}

const MOCK_MODEL_DETAIL_JSON = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Gemini 4 Carbon (Google) - AIHOT 详细评测成绩与证据链',
  items: [
    {
      id: 'aihot:model:gemini-4-carbon:overview',
      url: 'https://aihot.news/leaderboard/gemini-4-carbon',
      title: '【总览】Gemini 4 Carbon 综合评分 75.2 (第 1 名)',
      content_html: `<div>
        <p><strong>综合评分：</strong>75.2 (第 1 名)<br>
        <strong>开发机构：</strong>Google<br>
        <strong>API 定价：</strong>暂无官方按量价</p>
        <p><strong>五大领域分项分：</strong><br>编程：73.1分 · 科研：76.6分</p>
      </div>`,
      date_published: '2026-10-28T00:00:00.000Z',
      tags: ['总览', 'Google']
    },
    {
      id: 'aihot:model:gemini-4-carbon:coding',
      title: '【编程】Gemini 4 Carbon 领域得分: 73.1 分 (5项实测)',
      tags: ['编程', 'Google'],
      content_html: `<div>
        <h3>编程领域评测成绩</h3>
        <table>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td><a href="https://vals.ai/terminal-bench-4">Terminal-Bench 4.0</a><br><small>Vals AI</small></td>
              <td>63.1%</td>
              <td>76.5</td>
              <td>第 4 名</td>
              <td>High 推理</td>
            </tr>
          </tbody>
        </table>
      </div>`,
      date_published: '2026-10-28T00:00:00.000Z'
    },
    {
      id: 'aihot:model:gemini-4-carbon:unmeasured',
      title: '【待测项】Gemini 4 Carbon 尚未取得成绩的评测 (2项)',
      tags: ['待测项', 'Google'],
      content_html: `<div>
        <h3>尚未取得有效成绩的公开评测项（2项）：</h3>
        <ul>
          <li>LiveBench · 编程综合</li>
          <li>Code Migration</li>
        </ul>
      </div>`,
      date_published: '2026-10-28T00:00:00.000Z'
    }
  ]
}

describe('leaderboard data fetching and parsing', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/aihot/model/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(MOCK_MODEL_DETAIL_JSON)
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(MOCK_LEADERBOARD_JSON)
        })
      })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('correctly parses leaderboard items and scores', async () => {
    const items = await getModelLeaderboard('overall')
    expect(items.length).toBe(2)

    const gemini = items[0]
    expect(gemini.name).toBe('Gemini 4 Carbon')
    expect(gemini.creator).toBe('Google')
    expect(gemini.overallScore).toBe('75.2')
    expect(gemini.rank).toBe(1)
    expect(gemini.coverage?.count).toBe(17)
    expect(gemini.scores.编程?.score).toBe('73.1')
    expect(gemini.scores.编程?.rank).toBe('第2名')
    expect(gemini.pricing).toBeUndefined()

    const gpt = items[1]
    expect(gpt.name).toBe('GPT-6.1 Terra')
    expect(gpt.creator).toBe('OpenAI')
    expect(gpt.pricing?.input).toBe('6.66')
    expect(gpt.pricing?.output).toBe('33.31')
  })

  it('correctly parses model detail with benchmark evidence chain and unmeasured items', async () => {
    const detail = await getModelDetail('gemini-4-carbon')
    expect(detail).not.toBeNull()
    if (!detail) return

    expect(detail.name).toBe('Gemini 4 Carbon')
    expect(detail.creator).toBe('Google')
    expect(detail.overallScore).toBe('75.2')
    expect(detail.rank).toBe(1)

    expect(detail.evidenceSections.length).toBe(1)
    const codingSection = detail.evidenceSections[0]
    expect(codingSection.domain).toBe('编程')
    expect(codingSection.benchmarks.length).toBe(1)
    expect(codingSection.benchmarks[0].name).toBe('Terminal-Bench 4.0')
    expect(codingSection.benchmarks[0].evaluator).toBe('Vals AI')
    expect(codingSection.benchmarks[0].rawScore).toBe('63.1%')
    expect(codingSection.benchmarks[0].capabilityScore).toBe('76.5')
    expect(codingSection.benchmarks[0].config).toBe('High 推理')

    expect(detail.unmeasuredBenchmarks).toEqual(['LiveBench · 编程综合', 'Code Migration'])
  })
})
