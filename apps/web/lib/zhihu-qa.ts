export interface ZhihuQaAnswer {
  id: string
  author: string
  voteupCount: number
  url: string
  bodyHtml: string
}

export interface ZhihuQaContent {
  questionContextHtml: string | null
  answers: ZhihuQaAnswer[]
}

const ANSWER_HEADING_RE =
  /<h([23])\b[^>]*>\s*<a\b[^>]*\bhref="(https:\/\/www\.zhihu\.com\/question\/\d+\/answer\/(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/h\1>/gi
const IMAGE_PLACEHOLDER_RE = /^(?:\[(?:\d+\s*张)?图片\]\s*)+$/u
const VOTE_LABEL_RE = /^(.*?)\s*[（(]\s*([\d,]+)\s*赞同\s*[）)]$/u

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, ' ')
}

function stripTagsToText(html: string): string {
  return decodeBasicEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function isPlaceholderOnlyHtml(html: string): boolean {
  const text = stripTagsToText(html)
  return !text || IMAGE_PLACEHOLDER_RE.test(text)
}

function parseAnswerHeading(rawLabel: string): { author: string; voteupCount: number } {
  const label = stripTagsToText(rawLabel)
  const matched = label.match(VOTE_LABEL_RE)
  if (!matched) {
    return { author: label || '知乎用户', voteupCount: 0 }
  }
  const voteupCount = Number(matched[2].replace(/,/g, ''))
  return {
    author: matched[1].trim() || '知乎用户',
    voteupCount: Number.isFinite(voteupCount) && voteupCount > 0 ? voteupCount : 0
  }
}

function trimAnswerWrapperGlue(fragment: string): string {
  let cleaned = fragment
    .replace(/^(?:\s*<\/div>)+/i, '')
    .replace(/^(?:\s*<hr\s*\/?>)+/i, '')
    .replace(/(?:<div\b[^>]*>\s*(?:<hr\s*\/?>\s*)?)+$/i, '')
    .trim()

  // Each RSSHub answer is wrapped in a single <div>...</div>; strip one unmatched trailing </div>.
  const openDivs = (cleaned.match(/<div\b[^>]*>/gi) ?? []).length
  const closeDivs = (cleaned.match(/<\/div>/gi) ?? []).length
  if (closeDivs > openDivs) {
    for (let i = 0; i < closeDivs - openDivs; i++) {
      cleaned = cleaned.replace(/<\/div>\s*$/i, '').trim()
    }
  }
  return cleaned
}

function cleanAnswerBodyHtml(rawFragment: string): string {
  const unwrapped = trimAnswerWrapperGlue(rawFragment)
  return unwrapped
    .replace(/<h([2-6])\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/h\1>/gi, '')
    .replace(/^(?:\s*<p\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+/i, '')
    .replace(/(?:\s*<p\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/i, '')
    .replace(/<(\/?)h([2-5])\b/gi, (_match, slash: string, level: string) => {
      return `<${slash}h${Number(level) + 1}`
    })
    .trim()
}

function extractQuestionContext(prefixHtml: string): string | null {
  const trimmed = prefixHtml.replace(/(?:<div\b[^>]*>\s*(?:<hr\s*\/?>\s*)?)+$/i, '').trim()
  if (!trimmed) return null
  const blockquoteMatch = trimmed.match(/^<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>$/i)
  const inner = (blockquoteMatch ? blockquoteMatch[1] : trimmed).trim()
  return isPlaceholderOnlyHtml(inner) ? null : inner
}

export function isPlaceholderZhihuAuthor(
  source: string,
  author: string | null | undefined
): boolean {
  return source === 'zhihu' && author?.trim() === '用户'
}

export function parseZhihuQaContent(sanitizedHtml: string): ZhihuQaContent | null {
  if (!sanitizedHtml?.includes('www.zhihu.com/question/')) return null

  const matches = Array.from(sanitizedHtml.matchAll(ANSWER_HEADING_RE))
  if (matches.length === 0) return null

  const firstIndex = matches[0].index ?? 0
  const questionContextHtml = extractQuestionContext(sanitizedHtml.slice(0, firstIndex))
  const answers: ZhihuQaAnswer[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const id = current[3]
    if (seenIds.has(id)) continue
    const headingStart = current.index ?? 0
    const bodyStart = headingStart + current[0].length
    const bodyEnd =
      i + 1 < matches.length ? (matches[i + 1].index ?? sanitizedHtml.length) : sanitizedHtml.length
    const bodyHtml = cleanAnswerBodyHtml(sanitizedHtml.slice(bodyStart, bodyEnd))
    if (!stripTagsToText(bodyHtml)) continue

    seenIds.add(id)
    const { author, voteupCount } = parseAnswerHeading(current[4])
    answers.push({
      id,
      author,
      voteupCount,
      url: decodeBasicEntities(current[2]),
      bodyHtml
    })
  }

  if (answers.length === 0) return null
  return { questionContextHtml, answers }
}
