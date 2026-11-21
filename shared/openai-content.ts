// Transforms CCTV / Imperial CMS video codes into playable mount elements.
export function transformCctvVideoTags(text: string): string {
  if (!text?.includes('[!--begin:htmlVideoCode--]')) return text
  return text.replace(
    /(?:<p\b[^>]*>\s*)?\[!--begin:htmlVideoCode--\]([a-f0-9]{32})(?:,(\d+))?.*?\[!--end:htmlVideoCode--\](?:\s*<\/p>)?/gi,
    (_match, pid, type) => {
      const videoType = type ?? '0'
      return `<div data-cctv-video="${pid}" data-cctv-type="${videoType}" class="cctv-video-mount"></div>`
    }
  )
}

// Strips legacy CMS template tags while preserving playable video mounts.
export function cleanCmsTemplateTags(text: string): string {
  if (!text?.includes('[!--')) return text
  const withVideos = transformCctvVideoTags(text)
  return withVideos
    .replace(/\[!--begin:\w+--\][\s\S]*?\[!--end:\w+--\]/gi, '')
    .replace(/\[!--[\s\S]*?--\]/gi, '')
}

// RSSHub includes OpenAI's read-aloud control alongside the article body.
export function cleanOpenAiContent(html: string, url: string): string {
  try {
    if (new URL(url).hostname !== 'openai.com') return html
  } catch {
    return html
  }
  return html.replace(
    /<div\b[^>]*\bdata-read-aloud-ui\s*=\s*["']true["'][^>]*>[\s\S]*?<\/audio>\s*<\/div>/gi,
    ''
  )
}

function isAwsBlogUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'aws.amazon.com' && parsed.pathname.includes('/blogs/')
  } catch {
    return false
  }
}

function stripTrailingAwsAuthorChrome(prefix: string): string {
  let result = prefix.trimEnd()
  while (result) {
    const stripped = result
      .replace(/<(?:h[1-6]|p)\b[^>]*>\s*About the authors?:?\s*<\/(?:h[1-6]|p)>$/i, '')
      .replace(/<hr\b[^>]*\/?>$/i, '')
      .trimEnd()
    if (stripped === result) break
    result = stripped
  }
  return result
}

// AWS blog WordPress feeds append an author bio footer (and optional About heading / <hr>) inside body HTML.
export function cleanAwsBlogContent(html: string, url: string): string {
  if (!html || !isAwsBlogUrl(url)) return html
  let output = ''
  let cursor = 0
  for (const match of html.matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi)) {
    const index = match.index ?? 0
    const footer = match[0]
    if (!/\bblog-author-box\b/i.test(footer)) continue
    output += stripTrailingAwsAuthorChrome(html.slice(cursor, index))
    cursor = index + footer.length
  }
  if (cursor === 0) return html
  return (output + html.slice(cursor)).trim()
}

export function cleanFeedArticleHtml(html: string, url?: string): string {
  let cleaned = cleanCmsTemplateTags(html)
  if (url) {
    cleaned = cleanOpenAiContent(cleaned, url)
    cleaned = cleanAwsBlogContent(cleaned, url)
  }
  return cleaned
}
