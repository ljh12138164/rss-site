'use client'

import { X } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cn } from '../lib/utils'
import { ActionButton } from './action-button'

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
    <DialogTrigger>
      <Button
        aria-label={`预览图片：${previewLabel}`}
        className="block w-fit self-start cursor-zoom-in rounded-md p-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {image}
      </Button>
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
      >
        <Modal className="w-full max-w-5xl text-foreground">
          <Dialog className="outline-none">
            {({ close }) => (
              <>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <Heading slot="title" className="min-w-0 line-clamp-2 text-base font-semibold">
                    {previewLabel}
                  </Heading>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0"
                    aria-label="关闭图片预览"
                    onPress={close}
                  >
                    <X size={20} aria-hidden="true" />
                  </ActionButton>
                </div>
                <div className="flex items-center justify-center">
                  {/* biome-ignore lint/performance/noImgElement: preview uses the original RSS image without a server proxy. */}
                  <img
                    src={imageSrc}
                    alt={previewLabel}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="max-h-[75dvh] max-w-full object-contain"
                  />
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
