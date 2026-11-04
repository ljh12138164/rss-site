import { isReportDate, shanghaiDate } from '../../../shared/daily-report.js'

export interface DailyReportSubmission {
  date: string
  retry?: boolean
}
export interface DailyReportRuntime {
  dailyReportServiceUrl?: string
  agentServiceToken?: string
}

export function parseDailySubmission(value: unknown): DailyReportSubmission {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid input')
  const input = value as Record<string, unknown>
  if (
    Object.keys(input).some((key) => !['date', 'retry'].includes(key)) ||
    (input.retry !== undefined && typeof input.retry !== 'boolean') ||
    (input.retry === true && input.date === undefined)
  )
    throw new Error('Invalid input')
  const date = input.date ?? shanghaiDate()
  if (!isReportDate(date) || date > shanghaiDate()) throw new Error('Invalid date')
  return { date, ...(input.retry !== undefined ? { retry: input.retry as boolean } : {}) }
}

export async function submitDailyReport(
  runtime: DailyReportRuntime,
  input: DailyReportSubmission,
  trigger: 'auto' | 'manual' = 'manual'
) {
  if (!runtime.dailyReportServiceUrl || !runtime.agentServiceToken)
    throw new Error('daily_configuration')
  const url = new URL(runtime.dailyReportServiceUrl)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('daily_configuration')
  url.pathname = '/v1/agents/daily-report/jobs'
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        headers: {
          authorization: `Bearer ${runtime.agentServiceToken}`,
          'content-type': 'application/json',
          'x-daily-report-trigger': trigger
        },
        body: JSON.stringify(input)
      })
      if (![200, 202].includes(response.status)) {
        await response.body?.cancel()
        if (response.status === 429 || response.status >= 500) throw new Error('daily_temporary')
        throw new DailySubmissionRejected()
      }
      const reader = response.body?.getReader()
      if (!reader) throw new DailySubmissionRejected()
      const chunks: Uint8Array[] = []
      let size = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > 4096) throw new DailySubmissionRejected()
          chunks.push(value)
        }
      } finally {
        await reader.cancel().catch(() => undefined)
        reader.releaseLock()
      }
      const bytes = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.byteLength
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
      } catch {
        throw new DailySubmissionRejected()
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new DailySubmissionRejected()
      const data = parsed as {
        jobId?: unknown
        date?: unknown
        status?: unknown
        path?: unknown
      }
      if (
        typeof data.jobId !== 'string' ||
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(data.jobId) ||
        data.date !== input.date ||
        typeof data.status !== 'string' ||
        ![
          'queued',
          'running',
          'retry_wait',
          'published',
          'failed',
          'no_material',
          'no_news'
        ].includes(data.status)
      )
        throw new DailySubmissionRejected()
      return {
        status: response.status as 200 | 202,
        data: {
          jobId: data.jobId,
          date: input.date,
          status: data.status,
          ...(data.status === 'published' ? { path: `/daily/${input.date}` } : {})
        }
      }
    } catch (error) {
      if (error instanceof DailySubmissionRejected || attempt === 2)
        throw new Error('daily_submission_failed')
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
  }
  throw new Error('daily_submission_failed')
}

class DailySubmissionRejected extends Error {}
