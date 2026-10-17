// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ArticleSummary } from './article-summary'

const cache = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }))
vi.mock('../lib/article-summary-cache', () => ({
  readLocalSummary: cache.read,
  writeLocalSummary: cache.write
}))

let root: Root
let container: HTMLDivElement
const summary = {
  overview: '最终文章概述',
  keyPoints: ['第一点', '第二点', '第三点'],
  basis: 'content'
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  cache.read.mockReset().mockResolvedValue(null)
  cache.write.mockReset().mockResolvedValue(undefined)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

async function start(response: Response) {
  const fetcher = vi.fn(async (_url: unknown, _init?: RequestInit) => response)
  vi.stubGlobal('fetch', fetcher)
  await act(async () => root.render(<ArticleSummary articleId="one" cacheKey="one:v1" />))
  await act(async () => container.querySelector('button')?.click())
  return fetcher
}

it('renders progress before completion, caches once at EOF and reuses it after collapsing', async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value
    }
  })
  const fetcher = await start(
    new Response(body, { headers: { 'content-type': 'application/x-ndjson' } })
  )
  const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers)
  expect(headers.get('content-type')).toBe('application/json')
  expect(headers.get('accept')).toBe('application/x-ndjson')
  const send = async (event: unknown) =>
    act(async () => {
      controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`))
    })
  await send({ type: 'partial', summary: { overview: '正在出现的概述', keyPoints: ['部分要点'] } })
  expect(container.textContent).toContain('正在出现的概述')
  expect(container.querySelector('button')?.disabled).toBe(true)
  expect(cache.write).not.toHaveBeenCalled()
  await send({ type: 'done', summary })
  expect(cache.write).not.toHaveBeenCalled()
  await act(async () => controller.close())
  expect(container.textContent).toContain(summary.overview)
  expect(container.textContent).not.toContain('正在出现的概述')
  expect(cache.write).toHaveBeenCalledExactlyOnceWith('one:v1', summary)
  await act(async () => container.querySelector('button')?.click())
  expect(container.textContent).not.toContain(summary.overview)
  await act(async () => container.querySelector('button')?.click())
  expect(container.textContent).toContain(summary.overview)
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it('discards a failed draft and offers retry without caching it', async () => {
  const events = [
    { type: 'partial', summary: { overview: '不可缓存的片段', keyPoints: [] } },
    { type: 'error', error: 'private upstream error' }
  ]
    .map((event) => `${JSON.stringify(event)}\n`)
    .join('')
  await start(new Response(events, { headers: { 'content-type': 'application/x-ndjson' } }))
  expect(container.textContent).not.toContain('不可缓存的片段')
  expect(container.textContent).not.toContain('private upstream error')
  expect(container.querySelector('[role="alert"]')).not.toBeNull()
  expect(container.querySelector('button')?.textContent).toContain('重试')
  expect(cache.write).not.toHaveBeenCalled()
})

it('restores completed local summaries without a network call', async () => {
  cache.read.mockResolvedValue(summary)
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  await act(async () => root.render(<ArticleSummary articleId="one" cacheKey="one:v1" />))
  expect(container.textContent).toContain(summary.overview)
  expect(fetcher).not.toHaveBeenCalled()
})

it('aborts an in-flight request when leaving the page', async () => {
  let signal!: AbortSignal
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          if (!init.signal) throw new Error('Missing request signal')
          signal = init.signal
          signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
        })
    )
  )
  await act(async () => root.render(<ArticleSummary articleId="one" cacheKey="one:v1" />))
  await act(async () => container.querySelector('button')?.click())
  await act(async () => root.render(null))
  expect(signal.aborted).toBe(true)
  expect(cache.write).not.toHaveBeenCalled()
})
