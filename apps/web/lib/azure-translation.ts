let retryAfter = 0

export async function translateWithAzure(text: string, html = false): Promise<string | null> {
  const key = process.env.AZURE_TRANSLATOR_KEY?.trim()
  const input = html ? `<div>${text}</div>` : text
  // ponytail: oversized HTML uses MTran; split complete elements only if long articles need Azure.
  if (!key || input.length > 50_000 || Date.now() < retryAfter) return null

  try {
    const region = process.env.AZURE_TRANSLATOR_REGION?.trim()
    const response = await fetch(
      'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hans&textType=' +
        (html ? 'html' : 'plain'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Ocp-Apim-Subscription-Key': key,
          ...(region && region !== 'global' ? { 'Ocp-Apim-Subscription-Region': region } : {})
        },
        body: JSON.stringify([{ Text: input }]),
        signal: AbortSignal.timeout(20_000),
        cache: 'no-store'
      }
    )
    if (!response.ok) throw new Error('AZURE_TRANSLATION_FAILED')

    const payload: unknown = await response.json()
    const translations = Array.isArray(payload) ? payload[0]?.translations : undefined
    const translated = Array.isArray(translations)
      ? translations.find((entry) => entry?.to === 'zh-Hans')?.text
      : undefined
    if (typeof translated !== 'string' || !translated.trim())
      throw new Error('AZURE_TRANSLATION_INVALID')
    if (!html) return translated
    if (!translated.startsWith('<div>') || !translated.endsWith('</div>'))
      throw new Error('AZURE_TRANSLATION_INVALID_HTML')
    const body = translated.slice(5, -6)
    if (!body.trim()) throw new Error('AZURE_TRANSLATION_EMPTY_HTML')
    return body
  } catch {
    retryAfter = Date.now() + 60_000
    // Do not log upstream bodies/errors: they can contain article text or credentials.
    console.warn('[translation] Azure unavailable; using local translation for 60 seconds')
    return null
  }
}
