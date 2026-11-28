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

const MATHML_TAGS = [
  'math',
  'mrow',
  'mi',
  'mo',
  'mn',
  'ms',
  'mtext',
  'mspace',
  'msup',
  'msub',
  'msubsup',
  'mover',
  'munder',
  'munderover',
  'mfrac',
  'msqrt',
  'mroot',
  'mfenced',
  'mstyle',
  'mpadded',
  'mphantom',
  'menclose',
  'mtable',
  'mtr',
  'mtd',
  'mmultiscripts',
  'mprescripts',
  'none',
  'merror'
]

const KATEX_WRAPPER_CLASSES = new Set(['katex', 'katex-mathml', 'katex-display'])

const BLOG_IMAGE_DOMAINS = [
  [/^https:\/\/huggingface\.co\/blog\//i, 'huggingface.co'],
  [/^https:\/\/(?:www\.)?lmsys\.org\/blog\//i, 'lmsys.org'],
  [/^https:\/\/miles\.radixark\.com\/blogs\//i, 'miles.radixark.com']
] as const

function articleMediaUrl(value: string | undefined, base: string, domains: string[]) {
  if (!value) return undefined
  try {
    const url = new URL(value, base)
    const host = url.hostname
    const trusted = domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
    if (url.protocol === 'https:' && trusted && !url.username && !url.password) return url.href
  } catch {
    return undefined
  }
}

function hupuMediaUrl(value: string | undefined) {
  return articleMediaUrl(value, 'https://m.hupu.com', ['hupu.com', 'hoopchina.com.cn'])
}

// This function must run before stored, untrusted Feed HTML reaches the document.
export function renderArticleContent(html: string, originalUrl: string, _section?: string) {
  if (Buffer.byteLength(html, 'utf8') > 512 * 1024) return ''
  const isHupu = /^https:\/\/(?:m|bbs)\.hupu\.com\//i.test(originalUrl)
  const blogImageDomain = BLOG_IMAGE_DOMAINS.find(([pattern]) => pattern.test(originalUrl))?.[1]
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
      'a',
      ...(isHupu || blogImageDomain ? ['img'] : []),
      ...(isHupu ? ['video', 'source'] : []),
      ...(blogImageDomain ? ['figure', 'figcaption'] : []),
      ...MATHML_TAGS
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target', 'data-outbound'],
      code: ['class'],
      img: ['src', 'alt', 'loading', 'referrerpolicy'],
      video: ['src', 'poster', 'controls', 'preload', 'playsinline'],
      source: ['src', 'type'],
      div: ['data-cctv-video', 'data-cctv-type', 'class'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      ol: ['start'],
      math: [{ name: 'display', values: ['block', 'inline'] }],
      mi: ['mathvariant'],
      mn: ['mathvariant'],
      ms: ['mathvariant'],
      mtext: ['mathvariant'],
      mo: [
        'mathvariant',
        'stretchy',
        'fence',
        'separator',
        'lspace',
        'rspace',
        'accent',
        'symmetric'
      ],
      mfrac: ['linethickness'],
      mspace: ['width', 'height', 'depth'],
      mstyle: ['mathvariant'],
      mtd: ['columnspan', 'rowspan']
    },
    allowedClasses: { code: ['language-mermaid', 'lang-mermaid'] },
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
      'form',
      'button',
      'select',
      'annotation',
      'annotation-xml',
      'title',
      'noscript',
      'xmp',
      'noembed',
      'noframes',
      'plaintext'
    ],
    exclusiveFilter: (frame) => {
      if (['img', 'source'].includes(frame.tag)) return !frame.attribs.src
      if (frame.tag !== 'span') return false
      const classes = (frame.attribs.class ?? '').split(/\s+/)
      if (classes.includes('katex-html')) return true
      return classes.some((name) => KATEX_WRAPPER_CLASSES.has(name)) ? 'excludeTag' : false
    },
    transformTags: {
      img: (_tag, attributes): sanitizeHtml.Tag => {
        const src = isHupu
          ? hupuMediaUrl(attributes.src)
          : blogImageDomain
            ? articleMediaUrl(attributes.src, originalUrl, [blogImageDomain])
            : undefined
        return {
          tagName: 'img',
          attribs: src
            ? { src, alt: attributes.alt ?? '', loading: 'lazy', referrerpolicy: 'no-referrer' }
            : {}
        }
      },
      ...(isHupu
        ? {
            center: (_tag, attributes): sanitizeHtml.Tag => {
              const src = hupuMediaUrl(attributes['data-gif'] || attributes['data-origin'])
              return src
                ? {
                    tagName: 'img',
                    attribs: { src, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }
                  }
                : { tagName: 'div', attribs: {} }
            },
            video: (_tag, attributes): sanitizeHtml.Tag => {
              const src = hupuMediaUrl(attributes.src)
              const poster = hupuMediaUrl(attributes.poster)
              return {
                tagName: 'video',
                attribs: {
                  controls: '',
                  preload: 'none',
                  playsinline: '',
                  ...(src ? { src } : {}),
                  ...(poster ? { poster } : {})
                }
              }
            },
            source: (_tag, attributes): sanitizeHtml.Tag => {
              const src = hupuMediaUrl(attributes.src)
              return { tagName: 'source', attribs: src ? { src } : {} }
            }
          }
        : {}),
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
