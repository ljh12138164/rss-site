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

function stripHtmlTagsText(html: string): string {
  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTrailingAwsBlock(
  prefix: string
): { before: string; tag: string; inner: string } | null {
  const closeMatch = prefix.match(/<\/(h[1-6]|p)>\s*$/i)
  if (!closeMatch || closeMatch.index == null) return null
  const tag = closeMatch[1].toLowerCase()
  const closeIndex = closeMatch.index
  const openMatches = [
    ...prefix.slice(0, closeIndex).matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))
  ]
  const lastOpen = openMatches.at(-1)
  if (!lastOpen || lastOpen.index == null) return null
  return {
    before: prefix.slice(0, lastOpen.index),
    tag,
    inner: prefix.slice(lastOpen.index + lastOpen[0].length, closeIndex)
  }
}

function stripTrailingAwsBlankParagraph(prefix: string): string | null {
  const block = extractTrailingAwsBlock(prefix)
  if (block?.tag !== 'p') return null
  if (/<(?:img|video|audio|iframe|svg)\b/i.test(block.inner)) return null
  return stripHtmlTagsText(block.inner) === '' ? block.before : null
}

const AWS_AUTHOR_HEADING_RE =
  /^(?:about(?:\s+(?:the|our))?\s+authors?|authors?\s+bio(?:\(s\)|s)?):?$/i

function stripTrailingAwsHeading(prefix: string): string | null {
  const block = extractTrailingAwsBlock(prefix)
  if (!block) return null
  return AWS_AUTHOR_HEADING_RE.test(stripHtmlTagsText(block.inner)) ? block.before : null
}

function stripTrailingAwsAuthorChrome(prefix: string): string {
  let result = prefix.trimEnd()
  while (result) {
    const withoutHeadingOrBlank =
      stripTrailingAwsHeading(result) ?? stripTrailingAwsBlankParagraph(result)
    const stripped = (withoutHeadingOrBlank ?? result.replace(/<hr\b[^>]*\/?>$/i, '')).trimEnd()
    if (stripped === result) break
    result = stripped
  }
  return result
}

function stripTrailingBlankParagraphs(prefix: string): string {
  let result = prefix.trimEnd()
  while (result) {
    const next = stripTrailingAwsBlankParagraph(result)
    if (next == null) break
    result = next.trimEnd()
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
  const combined = cursor === 0 ? html : (output + html.slice(cursor)).trim()
  const withoutTrailingBlank = stripTrailingBlankParagraphs(combined)
  if (stripTrailingAwsHeading(withoutTrailingBlank) !== null) {
    return stripTrailingAwsAuthorChrome(withoutTrailingBlank).trim()
  }
  return combined
}

export function cleanFeedArticleHtml(html: string, url?: string): string {
  let cleaned = cleanCmsTemplateTags(html)
  if (url) {
    cleaned = cleanOpenAiContent(cleaned, url)
    cleaned = cleanAwsBlogContent(cleaned, url)
  }
  return cleaned
}
