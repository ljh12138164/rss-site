'use client'

import { AlertCircle, Play, RotateCw, Tv } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

interface CctvVideoInfo {
  title: string
  image: string
  hls_url: string
  totalLength?: string
}

export interface CctvVideoPlayerProps {
  pid: string
  type?: string
  className?: string
}

type VideoError =
  | { kind: 'status'; status: number }
  | { kind: 'key'; key: 'videoNoStream' | 'videoInfoFailed' | 'videoPlayerInitFailed' }
  | { kind: 'raw'; message: string }

function formatDuration(secondsStr?: string): string {
  if (!secondsStr) return ''
  const sec = Math.round(Number.parseFloat(secondsStr))
  if (Number.isNaN(sec) || sec <= 0) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function CctvVideoPlayer({ pid, type = '0', className }: CctvVideoPlayerProps) {
  const t = useTranslations('article')
  const tCommon = useTranslations('common')
  const containerRef = useRef<HTMLDivElement>(null)
  const unsupportedTextRef = useRef(t('videoUnsupported'))
  unsupportedTextRef.current = t('videoUnsupported')
  const [videoInfo, setVideoInfo] = useState<CctvVideoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<VideoError | null>(null)

  const isVertical = type === '6'

  const fetchVideoInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=${encodeURIComponent(pid)}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000)
        }
      )
      if (!response.ok) {
        setError({ kind: 'status', status: response.status })
        return
      }
      const data = await response.json()
      if (!data.hls_url) {
        setError({ kind: 'key', key: 'videoNoStream' })
        return
      }
      setVideoInfo({
        title: data.title || '',
        image: data.image || '',
        hls_url: data.hls_url,
        totalLength: data.video?.totalLength
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? { kind: 'raw', message: err.message }
          : { kind: 'key', key: 'videoInfoFailed' }
      )
    } finally {
      setIsLoading(false)
    }
  }, [pid])

  useEffect(() => {
    fetchVideoInfo()
  }, [fetchVideoInfo])

  useEffect(() => {
    if (!isPlaying || !videoInfo || !containerRef.current) return

    let artInstance: { destroy: (removeHtml?: boolean) => void } | null = null
    let isDisposed = false

    Promise.all([import('artplayer'), import('hls.js')])
      .then(([artModule, hlsModule]) => {
        if (isDisposed || !containerRef.current) return

        const Artplayer = artModule.default
        const Hls = hlsModule.default

        artInstance = new Artplayer({
          container: containerRef.current,
          url: videoInfo.hls_url,
          type: 'm3u8',
          customType: {
            m3u8: (video: HTMLVideoElement, url: string, art: typeof Artplayer.prototype) => {
              if (Hls.isSupported()) {
                const hls = new Hls({
                  maxBufferLength: 30,
                  enableWorker: true
                })
                hls.loadSource(url)
                hls.attachMedia(video)
                ;(art as { hls?: unknown }).hls = hls
                art.on('destroy', () => hls.destroy())
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url
              } else {
                art.notice.show = unsupportedTextRef.current
              }
            }
          },
          poster: videoInfo.image,
          theme: '#2563eb',
          volume: 0.8,
          isLive: false,
          muted: false,
          autoplay: true,
          pip: true,
          autoSize: false,
          autoMini: true,
          screenshot: true,
          setting: true,
          loop: false,
          playbackRate: true,
          aspectRatio: true,
          fullscreen: true,
          fullscreenWeb: true,
          autoOrientation: true,
          airplay: true,
          playsInline: true
        })
      })
      .catch((err) => {
        if (!isDisposed) {
          setError(
            err instanceof Error
              ? { kind: 'raw', message: err.message }
              : { kind: 'key', key: 'videoPlayerInitFailed' }
          )
        }
      })

    return () => {
      isDisposed = true
      if (artInstance) {
        artInstance.destroy(false)
      }
    }
  }, [isPlaying, videoInfo])

  const aspectClass = isVertical ? 'aspect-[9/16] max-w-[340px] mx-auto' : 'aspect-video w-full'

  if (error) {
    return (
      <div
        className={cn(
          'my-6 flex flex-col items-center justify-center rounded-sm border border-destructive/30 bg-destructive/5 p-6 text-center text-sm',
          aspectClass,
          className
        )}
      >
        <AlertCircle className="size-8 text-destructive/80 mb-2" />
        <p className="font-medium text-foreground mb-1">{t('videoFailed')}</p>
        <p className="text-xs text-muted-foreground mb-4">
          {error.kind === 'status'
            ? t('videoRequestFailed', { status: error.status })
            : error.kind === 'key'
              ? t(error.key)
              : error.message}
        </p>
        <button
          type="button"
          onClick={fetchVideoInfo}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors cursor-pointer"
        >
          <RotateCw className="size-3.5" />
          {tCommon('retry')}
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'my-6 flex flex-col items-center justify-center rounded-sm border border-border bg-card animate-pulse',
          aspectClass,
          className
        )}
      >
        <Tv className="size-8 text-muted-foreground/40 mb-2" />
        <span className="text-xs text-muted-foreground">{t('videoLoading')}</span>
      </div>
    )
  }

  if (isPlaying) {
    return (
      <div
        className={cn(
          'my-6 overflow-hidden rounded-sm border border-border shadow-md bg-black relative',
          aspectClass,
          className
        )}
      >
        <div ref={containerRef} className="size-full" />
      </div>
    )
  }

  const durationText = formatDuration(videoInfo?.totalLength)
  const displayTitle = videoInfo?.title || t('videoDefaultTitle')

  return (
    <div
      className={cn(
        'group relative my-6 overflow-hidden rounded-sm border border-border bg-black/90 shadow-md transition-all hover:border-primary/50',
        aspectClass,
        className
      )}
    >
      {videoInfo?.image ? (
        // biome-ignore lint/performance/noImgElement: dynamic external cctv video poster from unconfigured CDN
        <img
          src={videoInfo.image}
          alt={displayTitle}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black" />
      )}

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30 transition-opacity group-hover:from-black/75 group-hover:via-black/30" />

      {/* Top Channel Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white/90 border border-white/10">
        <Tv className="size-3.5 text-red-500" />
        <span>{t('videoBadge')}</span>
      </div>

      {/* Duration Badge */}
      {durationText && (
        <div className="absolute top-3 right-3 z-10 rounded bg-black/70 backdrop-blur-sm px-2 py-0.5 font-mono text-[11px] text-white/90">
          {durationText}
        </div>
      )}

      {/* Center Play Button */}
      <button
        type="button"
        onClick={() => setIsPlaying(true)}
        aria-label={t('videoPlayLabel', { title: displayTitle })}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center cursor-pointer focus:outline-none"
      >
        <div className="relative mb-2 flex size-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary">
          <Play className="size-6 fill-current translate-x-0.5" />
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
        </div>
        <p className="max-w-[85%] text-xs font-medium text-white/90 line-clamp-1 drop-shadow-md">
          {displayTitle}
        </p>
      </button>

      {/* Bottom Title Bar */}
      <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 pointer-events-none">
        <p className="text-xs text-white/70 line-clamp-1">{t('videoPlayHint')}</p>
      </div>
    </div>
  )
}
