export const MAX_FEED_BYTES = 5_000_000

export async function readBoundedText(
  response: Response,
  maxBytes = MAX_FEED_BYTES
): Promise<string> {
  const contentLength = Number(response.headers.get('Content-Length'))
  if (contentLength > maxBytes) {
    throw new Error('Signal feed exceeded the response size limit')
  }
  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new Error('Signal feed exceeded the response size limit')
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

export async function fetchSignalFeed(
  url: string,
  options: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<string> {
  const { timeoutMs = 30_000, maxBytes = MAX_FEED_BYTES } = options
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'rss-site/1.0 (+https://github.com/ljh12138164/rss-site)' }
  })
  if (!response.ok) {
    throw new Error(`Signal feed responded with ${response.status}`)
  }
  return readBoundedText(response, maxBytes)
}
