'use client'

import { type ReactNode, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
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
  previewLabel?: string
}

export function CoverImage({
  src,
  fallbackSrc = defaultCover,
  fallback,
  alt = '',
  width = 160,
  height = 100,
  loading = 'lazy',
  className,
  previewLabel
}: CoverImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
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
  const image = (
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
  if (!previewLabel || !src?.trim() || imageSrc !== src.trim()) return image

  return (
    <>
      <button
        type="button"
        aria-label={`预览图片：${previewLabel}`}
        aria-haspopup="dialog"
        aria-expanded={previewOpen}
        onClick={() => setPreviewOpen(true)}
        className="block w-fit self-start cursor-zoom-in rounded-md p-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {image}
      </button>
      <Lightbox
        open={previewOpen}
        close={() => setPreviewOpen(false)}
        slides={[{ src: imageSrc, alt: previewLabel }]}
        carousel={{ finite: true, imageProps: { referrerPolicy: 'no-referrer' } }}
        controller={{ closeOnBackdropClick: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
        labels={{ Lightbox: '图片预览', Close: '关闭图片预览' }}
      />
    </>
  )
}
