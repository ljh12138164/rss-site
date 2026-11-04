import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isReportDate, reportWindow, shanghaiDate } from '../../../shared/daily-report.js'
import { parseDailySubmission, submitDailyReport } from './daily-report.js'
import { configureApp } from './http-app.js'

afterEach(() => vi.unstubAllGlobals())
describe('daily report dates and submission', () => {
  it.each(['2026-02-29', '2026-11-31', '2026-1-01', '../today', '1999-12-31'])(
    'rejects impossible or non-canonical date %s',
    (date) => expect(isReportDate(date)).toBe(false)
  )
  it('uses the preceding Shanghai calendar day across leap years and UTC boundaries', () => {
    expect(reportWindow('2026-11-04')).toEqual({
      windowStart: '2026-11-02T16:00:00.000Z',
      windowEnd: '2026-11-03T16:00:00.000Z'
    })
    expect(reportWindow('2024-03-01').windowStart).toBe('2024-02-28T16:00:00.000Z')
    expect(reportWindow('2027-01-01').windowStart).toBe('2026-12-30T16:00:00.000Z')
    expect(shanghaiDate(Date.parse('2026-11-03T16:00:00Z'))).toBe('2026-11-04')
  })
  it.each([
    { retry: true },
    { date: '2999-01-01' },
    { date: '2026-02-30' },
    { date: '2026-01-01', url: 'https://evil.example' }
  ])('rejects invalid manual input %j', (value) =>
    expect(() => parseDailySubmission(value)).toThrow()
  )
  it('retries a temporary failure with the same durable date', async () => {
    const data = {
      jobId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2026-11-04',
      status: 'queued'
    }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json(data, { status: 202 }))
    vi.stubGlobal('fetch', fetcher)
    expect(
      await submitDailyReport(
        { dailyReportServiceUrl: 'https://agent.example', agentServiceToken: 'synthetic' },
        { date: data.date }
      )
    ).toEqual({ status: 202, data })
    expect(fetcher.mock.calls.map((call) => call[1].body)).toEqual([
      JSON.stringify({ date: data.date }),
      JSON.stringify({ date: data.date })
    ])
  })
  it('does not retry an authentication failure', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 401 }))
    vi.stubGlobal('fetch', fetcher)
    await expect(
      submitDailyReport(
        { dailyReportServiceUrl: 'https://agent.example', agentServiceToken: 'synthetic' },
        { date: '2026-01-01' }
      )
    ).rejects.toThrow('daily_submission_failed')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it.each(['not JSON', 'x'.repeat(4097)])(
    'rejects malformed or oversized acknowledgements without retry',
    async (body) => {
      const fetcher = vi.fn().mockResolvedValue(new Response(body, { status: 202 }))
      vi.stubGlobal('fetch', fetcher)
      await expect(
        submitDailyReport(
          { dailyReportServiceUrl: 'https://agent.example', agentServiceToken: 'synthetic' },
          { date: '2026-01-01' }
        )
      ).rejects.toThrow('daily_submission_failed')
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  )
  it('authenticates and validates the manual endpoint before submitting', async () => {
    const submit = vi.fn().mockResolvedValue({ status: 202, data: { status: 'queued' } })
    const app = configureApp(new Hono(), {
      cronSecret: 'synthetic',
      runIngestion: vi.fn(),
      submitDailyReport: submit
    })
    const request = (body: unknown, authorization = 'Bearer synthetic') =>
      app.request('/cron/daily-report', {
        method: 'POST',
        headers: { authorization, 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })
    expect((await request({}, 'Bearer wrong')).status).toBe(401)
    expect((await request({ retry: true })).status).toBe(400)
    expect(submit).not.toHaveBeenCalled()
    expect((await request({ date: '2026-01-01' })).status).toBe(202)
    expect(submit).toHaveBeenCalledWith({ date: '2026-01-01' })
  })
})
