'use client'

import { CctvVideoPlayer } from './cctv-video-player'

export interface ArticleHtmlBodyProps {
  html: string
  className?: string
}

const CCTV_MOUNT_REGEX = /(<div\b[^>]*data-cctv-video=["'][a-f0-9]{32}["'][^>]*><\/div>)/gi
const EXTRACT_CCTV_ATTRS =
  /<div\b[^>]*data-cctv-video=["']([a-f0-9]{32})["'](?:[^>]*data-cctv-type=["'](\d+)["'])?[^>]*><\/div>/i

export function ArticleHtmlBody({ html, className }: ArticleHtmlBodyProps) {
  if (!html) return null

  if (!html.includes('data-cctv-video')) {
    return (
      <div
        className={className ?? 'article-content'}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-sanitized feed HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  const parts = html.split(CCTV_MOUNT_REGEX)

  return (
    <div className={className ?? 'article-content'}>
      {parts.map((part, index) => {
        if (!part) return null

        const match = part.match(EXTRACT_CCTV_ATTRS)
        if (match) {
          const pid = match[1]
          const type = match[2] ?? '0'
          // biome-ignore lint/suspicious/noArrayIndexKey: parts is a static split of a single article body
          return <CctvVideoPlayer key={`cctv-video-${pid}-${index}`} pid={pid} type={type} />
        }

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: parts is a static split of a single article body
            key={`html-block-${index}`}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: server-sanitized feed HTML
            dangerouslySetInnerHTML={{ __html: part }}
          />
        )
      })}
    </div>
  )
}
