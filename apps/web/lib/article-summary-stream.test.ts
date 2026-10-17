import { expect, it, vi } from 'vitest'
import { readSummaryStream } from './article-summary-stream'

const summary = { overview: '文章概述', keyPoints: ['一', '二', '三'], basis: 'content' }
const line = (event: unknown) => `${JSON.stringify(event)}\n`
function response(text: string) {
  const bytes = new TextEncoder().encode(text)
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte))
        controller.close()
      }
    }),
    { headers: { 'content-type': 'application/x-ndjson' } }
  )
}

it('renders split UTF-8 drafts and clears them on fallback, returning only validated completion', async () => {
  const draft = { overview: '文章', keyPoints: [] }
  const progress = vi.fn()
  expect(
    await readSummaryStream(
      response(
        line({ type: 'partial', summary: draft }) +
          line({ type: 'reset' }) +
          line({ type: 'done', summary })
      ),
      progress
    )
  ).toEqual(summary)
  expect(progress.mock.calls).toEqual([[draft], [null]])
})

it('shows progress while the stream is still open and waits for clean EOF before cache eligibility', async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value
    }
  })
  const progress = vi.fn()
  const complete = vi.fn()
  const pending = readSummaryStream(
    new Response(body, { headers: { 'content-type': 'application/x-ndjson' } }),
    progress
  ).then(complete)
  const encode = (event: unknown) => new TextEncoder().encode(line(event))
  controller.enqueue(encode({ type: 'partial', summary: { overview: '文章', keyPoints: [] } }))
  await vi.waitFor(() => expect(progress).toHaveBeenCalledTimes(1))
  expect(complete).not.toHaveBeenCalled()
  controller.enqueue(encode({ type: 'done', summary }))
  await new Promise((resolve) => setImmediate(resolve))
  expect(complete).not.toHaveBeenCalled()
  controller.close()
  await pending
  expect(complete).toHaveBeenCalledWith(summary)
})

it.each([
  line({ type: 'partial', summary: { overview: 'partial', keyPoints: [] } }),
  line({ type: 'done', summary }) + line({ type: 'error', error: 'private upstream error' }),
  line({ type: 'done', summary: { ...summary, keyPoints: [] } }),
  JSON.stringify({ type: 'done', summary }),
  line({ type: 'unknown' }),
  line({ type: 'partial', summary: { overview: 'x'.repeat(801), keyPoints: [] } })
])(
  'rejects incomplete, malformed or late-failed streams without exposing upstream errors',
  async (text) => {
    await expect(readSummaryStream(response(text), vi.fn())).rejects.toThrow('暂时无法生成总结')
  }
)

it('cancels an invalid response reader', async () => {
  const cancel = vi.fn()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('bad json\n'))
    },
    cancel
  })
  await expect(
    readSummaryStream(
      new Response(body, { headers: { 'content-type': 'application/x-ndjson' } }),
      vi.fn()
    )
  ).rejects.toThrow()
  expect(cancel).toHaveBeenCalledTimes(1)
})
