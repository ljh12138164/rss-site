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

const OPEN_AI_HERO_DIV_ATTRS = ['data-read-aloud-ui', 'data-article-hero-actions'] as const

function stripDivsWithAttr(html: string, attrName: string): string {
  const marker = new RegExp(
    `<div\\b[^>]*\\b${attrName}(?:\\s*=\\s*["']true["'])?(?=[\\s/>])[^>]*>`,
    'gi'
  )
  let result = ''
  let cursor = 0
  while (cursor < html.length) {
    marker.lastIndex = cursor
    const match = marker.exec(html)
    if (!match || match.index == null) {
      result += html.slice(cursor)
      break
    }
    const start = match.index
    const scan = start + match[0].length
    if (match[0].endsWith('/>')) {
      result += html.slice(cursor, start)
      cursor = scan
      continue
    }
    let depth = 1
    const tagRe = /<\/?div\b[^>]*>/gi
    tagRe.lastIndex = scan
    let end = html.length
    while (depth > 0) {
      const token = tagRe.exec(html)
      if (!token) break
      if (token[0].endsWith('/>')) continue
      if (token[0].startsWith('</')) {
        depth -= 1
        if (depth === 0) {
          end = token.index + token[0].length
          break
        }
      } else {
        depth += 1
      }
    }
    result += html.slice(cursor, start)
    cursor = end
  }
  return result
}

function stripEmptyDivWrappers(html: string): string {
  let current = html
  while (true) {
    const next = current.replace(/<div\b[^>]*>\s*<\/div>/gi, '')
    if (next === current) return current.trim()
    current = next
  }
}

function extractCodeLanguageAttr(attrs: string): string | undefined {
  return (
    attrs.match(/\bdata-language\s*=\s*["']([\w-]+)["']/i)?.[1] ??
    attrs.match(/\bclass\s*=\s*["'][^"']*\blanguage-([\w-]+)\b[^"']*["']/i)?.[1]
  )
}

function stripShikiCodeBloat(html: string): string {
  return html
    .replace(/<\/?astro-island\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi, '')
    .replace(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi, (_block, preAttrs: string, inner: string) => {
      const preLang = extractCodeLanguageAttr(preAttrs)
      const cleanedInner = inner
        .replace(/<\/?span\b[^>]*>/gi, '')
        .replace(/<code\b([^>]*)>/gi, (_codeTag, attrs: string) => {
          const lang = extractCodeLanguageAttr(attrs) ?? preLang
          return lang ? `<code class="language-${lang}">` : '<code>'
        })
      return `<pre>${cleanedInner}</pre>`
    })
}

// RSSHub includes OpenAI's read-aloud / share controls alongside the article body, and Astro/Shiki markup can inflate developers.openai.com posts past 512 KB.
export function cleanOpenAiContent(html: string, url: string): string {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return html
  }
  if (host === 'developers.openai.com') {
    return stripShikiCodeBloat(html)
  }
  if (host !== 'openai.com') return html
  let cleaned = html
  for (const attr of OPEN_AI_HERO_DIV_ATTRS) {
    cleaned = stripDivsWithAttr(cleaned, attr)
  }
  if (cleaned !== html) {
    cleaned = stripEmptyDivWrappers(cleaned)
    if (!stripHtmlTagsText(cleaned) && !/<(?:img|video|audio|iframe|table|pre)\b/i.test(cleaned)) {
      return ''
    }
  }
  return cleaned
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
