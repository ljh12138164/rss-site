import sanitizeHtml from 'sanitize-html'
import { cleanFeedArticleHtml } from '../../../shared/openai-content'

// OpenAI embeds desktop and mobile TOCs in its feed body. The reader supplies its own.
function removeOpenAiContents(html: string, originalUrl: string) {
  let article: URL
  try {
    article = new URL(originalUrl)
    if (article.hostname !== 'openai.com') return html
  } catch {
    return html
  }
  const text = (value: string) =>
    sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim()
  const headings = new Set(
    Array.from(html.matchAll(/<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/gi), (match) => text(match[1]))
  )
  return html.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (list, _tag, body: string) => {
    const itemPattern =
      /<li\b[^>]*>\s*<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi
    const items = Array.from(body.matchAll(itemPattern))
    if (items.length < 2 || body.replace(itemPattern, '').trim()) return list
    const isContents = items.every((item) => {
      try {
        const link = new URL(item[1].replace(/&amp;/g, '&'), article)
        return (
          link.origin === article.origin &&
          link.pathname.replace(/\/+$/, '') === article.pathname.replace(/\/+$/, '') &&
          link.search === article.search &&
          Boolean(link.hash) &&
          headings.has(text(item[2]))
        )
      } catch {
        return false
      }
    })
    return isContents ? '' : list
  })
}

// This function must run before stored, untrusted Feed HTML reaches the document.
export function renderArticleContent(html: string, originalUrl: string, _section?: string) {
  if (Buffer.byteLength(html, 'utf8') > 512 * 1024) return ''
  return sanitizeHtml(removeOpenAiContents(cleanFeedArticleHtml(html, originalUrl), originalUrl), {
    allowedTags: [
      'p',
      'div',
      'span',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'br',
      'hr',
      'strong',
      'b',
      'em',
      'i',
      's',
      'del',
      'sub',
      'sup',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'table',
      'caption',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'a'
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target', 'data-outbound'],
      div: ['data-cctv-video', 'data-cctv-type', 'class'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      ol: ['start']
    },
    allowedSchemes: ['https', 'http'],
    allowProtocolRelative: false,
    nonTextTags: [
      'script',
      'style',
      'textarea',
      'option',
      'iframe',
      'object',
      'svg',
      'math',
      'form',
      'button',
      'select'
    ],
    transformTags: {
      h1: 'h2',
      a: (_tag, attributes): sanitizeHtml.Tag => {
        try {
          const href = attributes.href ?? ''
          const existingOutbound = href.startsWith('/out?')
            ? new URL(href, 'https://local.invalid').searchParams.get('url')
            : null
          const url = new URL(existingOutbound ?? href, originalUrl)
          if (!href || !['https:', 'http:'].includes(url.protocol) || url.username || url.password)
            throw new Error('Unsafe link')
          return {
            tagName: 'a',
            attribs: {
              href: url.href,
              target: '_blank',
              rel: 'nofollow noopener noreferrer',
              'data-outbound': 'true'
            }
          }
        } catch {
          return { tagName: 'span', attribs: {} }
        }
      }
    }
  }).trim()
}
