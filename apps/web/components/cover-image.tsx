'use client'

import { type ReactNode, useState } from 'react'
import { cn } from '../lib/utils'

const defaultCover = '/article-cover-default.svg'

export interface CoverImageProps {
  src?: string | null
  fallbackSrc?: string
  fallback?: ReactNode
  alt?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  className?: string
}

export function CoverImage({
  src,
  fallbackSrc = defaultCover,
  fallback,
  alt = '',
  width = 160,
  height = 100,
  loading = 'lazy',
  className
}: CoverImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([])
  const imageSrc = [src?.trim(), fallbackSrc.trim(), defaultCover].find(
    (value): value is string =>
      typeof value === 'string' && !!value && !failedSources.includes(value)
  )
  const imageClass = cn(
    'block h-auto w-full rounded-md border border-border/60 bg-muted object-cover',
    className
  )
  const style = { aspectRatio: `${width} / ${height}` }
  const showFallback = fallback && (!src?.trim() || failedSources.includes(src.trim()))
  if (showFallback || !imageSrc) {
    return (
      <span
        className={cn(imageClass, 'grid place-items-center')}
        style={style}
        role="img"
        aria-label={alt || '文章封面'}
        aria-hidden={!alt}
      >
        {showFallback ? fallback : null}
      </span>
    )
  }
  return (
    // biome-ignore lint/performance/noImgElement: RSS images use native lazy loading without a server proxy.
    <img
      src={imageSrc}
      key={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      className={imageClass}
      style={style}
      onError={() => {
        setFailedSources((previous) =>
          previous.includes(imageSrc) ? previous : [...previous, imageSrc]
        )
      }}
    />
  )
}
