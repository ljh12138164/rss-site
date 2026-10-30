'use client'

import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'
import { renderArticleDiagrams } from '../lib/article-diagrams'
import { CctvVideoPlayer } from './cctv-video-player'

export interface ArticleHtmlBodyProps {
  html: string
  className?: string
  lang?: string
}

const CCTV_MOUNT_REGEX = /(<div\b[^>]*data-cctv-video=["'][a-f0-9]{32}["'][^>]*><\/div>)/gi
const EXTRACT_CCTV_ATTRS =
  /<div\b[^>]*data-cctv-video=["']([a-f0-9]{32})["'](?:[^>]*data-cctv-type=["'](\d+)["'])?[^>]*><\/div>/i

export function ArticleHtmlBody({ html, className, lang }: ArticleHtmlBodyProps) {
  const root = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    if (html && root.current) return renderArticleDiagrams(root.current, resolvedTheme === 'dark')
  }, [html, resolvedTheme])

  if (!html) return null

  if (!html.includes('data-cctv-video')) {
    return (
      <div
        ref={root}
        className={className ?? 'article-content'}
        lang={lang}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-sanitized feed HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  const parts = html.split(CCTV_MOUNT_REGEX)

  return (
    <div ref={root} className={className ?? 'article-content'} lang={lang}>
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
