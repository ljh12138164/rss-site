'use client'

import { ImageOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

const signalBars = [
  ['lead', 'h-1.5'],
  ['rise', 'h-3'],
  ['peak', 'h-4'],
  ['dip', 'h-2'],
  ['echo', 'h-3.5'],
  ['tail', 'h-1.5']
] as const

export function MediaPreview({
  imageUrl,
  alt = '',
  className
}: {
  imageUrl?: string | null
  alt?: string
  className?: string
}) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const isLoaded = Boolean(imageUrl && loadedUrl === imageUrl)
  const hasUsableImage = Boolean(imageUrl && failedUrl !== imageUrl)

  useEffect(() => {
    const image = imageRef.current
    if (!imageUrl || !image?.complete) return

    if (image.naturalWidth > 0) setLoadedUrl(imageUrl)
    else setFailedUrl(imageUrl)
  }, [imageUrl])

  return (
    <span
      className={cn(
        'relative block aspect-video overflow-hidden rounded-sm border border-border bg-muted',
        className
      )}
      data-state={isLoaded ? 'loaded' : hasUsableImage ? 'loading' : 'fallback'}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
      >
        <ImageOff className="size-5" strokeWidth={1.5} />
        <span className="flex h-4 items-center gap-1">
          {signalBars.map(([id, height]) => (
            <span className={cn('w-px bg-border', height)} key={id} />
          ))}
        </span>
        <span className="font-mono text-[0.625rem] tracking-[0.14em]">MEDIA SIGNAL</span>
      </span>
      {hasUsableImage ? (
        <span className="absolute inset-0">
          {/* biome-ignore lint/performance/noImgElement: Feed image hosts are dynamic; proxying arbitrary hosts through next/image would require an unsafe wildcard. */}
          <img
            alt={alt}
            className={cn(
              'size-full object-cover opacity-0 transition-opacity duration-200 motion-reduce:transition-none',
              isLoaded && 'opacity-100'
            )}
            decoding="async"
            loading="lazy"
            onError={() => setFailedUrl(imageUrl ?? null)}
            onLoad={() => setLoadedUrl(imageUrl ?? null)}
            ref={imageRef}
            referrerPolicy="no-referrer"
            src={imageUrl ?? undefined}
          />
        </span>
      ) : null}
    </span>
  )
}
