'use client'

import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CoverImage } from './cover-image'

export function BilibiliVideo({
  playerUrl,
  title,
  cover
}: {
  playerUrl: string | null
  title: string
  cover?: string | null
}) {
  const t = useTranslations('article')
  const [started, setStarted] = useState(false)

  return (
    <div className="relative my-6 aspect-video overflow-hidden rounded-md border border-border bg-black sm:my-8">
      {started && playerUrl ? (
        <iframe
          src={playerUrl}
          title={t('bilibiliPlayerTitle', { title })}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
          ref={(frame) => {
            frame?.focus()
          }}
        />
      ) : (
        <>
          <CoverImage
            src={cover}
            width={640}
            height={360}
            loading="eager"
            className="absolute inset-0 size-full rounded-none border-0"
          />
          {playerUrl && (
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="absolute inset-0 grid w-full cursor-pointer place-items-center bg-black/20 hover:bg-black/30 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
            >
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-background px-4 text-sm font-semibold text-foreground">
                <Play className="size-4 fill-current" aria-hidden="true" />
                {t('bilibiliPlay')}
              </span>
            </button>
          )}
        </>
      )}
    </div>
  )
}
