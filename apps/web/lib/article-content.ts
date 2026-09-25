import sanitizeHtml from 'sanitize-html'
import { cleanFeedArticleHtml } from '../../../shared/openai-content'

// This function must run before stored, untrusted Feed HTML reaches the document.
export function renderArticleContent(html: string, originalUrl: string, section: string) {
  if (Buffer.byteLength(html, 'utf8') > 512 * 1024) return ''
  return sanitizeHtml(cleanFeedArticleHtml(html, originalUrl), {
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
      a: ['href', 'rel'],
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
              href: `/out?url=${encodeURIComponent(url.href)}&from=${encodeURIComponent(`/${section}`)}`,
              rel: 'nofollow noopener noreferrer'
            }
          }
        } catch {
          return { tagName: 'span', attribs: {} }
        }
      }
    }
  }).trim()
}
