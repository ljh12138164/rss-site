'use client'

import { Check, Copy, Download, Image as ImageIcon, RefreshCw, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import type { DailyReport } from '../../../../shared/daily-report'
import { formatDailyBriefingText } from '../../lib/daily-share'
import { ActionButton } from '../action-button'

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = []
  let current = ''
  for (const char of text.replace(/\s+/g, ' ').trim()) {
    const next = current + char
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = char
      if (lines.length === maxLines) {
        lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`
        return lines
      }
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function renderDailyShareCard(report: DailyReport, host: string): Promise<Blob> {
  const width = 540
  const padding = 36
  const contentWidth = width - padding * 2
  const stories = report.content.stories.slice(0, 5)
  const measureCanvas = document.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')
  if (!measureCtx) return Promise.reject(new Error('Canvas unavailable'))

  const sansFont = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
  const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

  measureCtx.font = `400 15px ${sansFont}`
  const overviewLines = wrapText(measureCtx, report.content.overview.text, contentWidth - 28, 4)

  const laidOutStories = stories.map((story) => {
    measureCtx.font = `600 16px ${sansFont}`
    const titleLines = wrapText(measureCtx, story.title, contentWidth - 36, 2)
    measureCtx.font = `400 13px ${sansFont}`
    const summaryLines = wrapText(measureCtx, story.summary, contentWidth - 36, 3)
    return { titleLines, summaryLines }
  })

  const headerHeight = 112
  const overviewHeight = 36 + overviewLines.length * 24 + 24
  const storiesHeight = laidOutStories.reduce(
    (sum, item) => sum + item.titleLines.length * 24 + item.summaryLines.length * 20 + 28,
    0
  )
  const footerHeight = 76
  const height = Math.max(720, headerHeight + overviewHeight + storiesHeight + footerHeight + 36)

  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas unavailable'))
  ctx.scale(scale, scale)

  // Midnight Enamel background
  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(0, 0, width, height)

  // Top accent bar
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(0, 0, width, 4)

  // Header
  ctx.fillStyle = '#38bdf8'
  ctx.font = `600 12px ${monoFont}`
  ctx.fillText(`DAILY BRIEFING · ${report.reportDate}`, padding, 44)

  ctx.fillStyle = '#f1f5f9'
  ctx.font = `700 28px ${sansFont}`
  ctx.fillText('今日热点 · 每日日报', padding, 82)

  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 12px ${monoFont}`
  ctx.fillText(`${report.storyCount} 条要闻 · ${report.sourceCount} 篇来源`, padding, 106)

  // Overview box
  let y = 128
  const boxHeight = 30 + overviewLines.length * 24 + 14
  ctx.fillStyle = '#131924'
  ctx.strokeStyle = '#243044'
  ctx.lineWidth = 1
  ctx.fillRect(padding, y, contentWidth, boxHeight)
  ctx.strokeRect(padding, y, contentWidth, boxHeight)

  ctx.fillStyle = '#38bdf8'
  ctx.font = `600 11px ${monoFont}`
  ctx.fillText('今日概览', padding + 14, y + 22)

  ctx.fillStyle = '#e2e8f0'
  ctx.font = `400 15px ${sansFont}`
  overviewLines.forEach((line, idx) => {
    ctx.fillText(line, padding + 14, y + 46 + idx * 24)
  })
  y += boxHeight + 24

  // Stories
  laidOutStories.forEach((item, idx) => {
    ctx.fillStyle = '#38bdf8'
    ctx.font = `700 14px ${monoFont}`
    ctx.fillText(String(idx + 1).padStart(2, '0'), padding, y + 16)

    ctx.fillStyle = '#f8fafc'
    ctx.font = `600 16px ${sansFont}`
    item.titleLines.forEach((line, lineIdx) => {
      ctx.fillText(line, padding + 32, y + 16 + lineIdx * 24)
    })
    y += item.titleLines.length * 24 + 4

    ctx.fillStyle = '#94a3b8'
    ctx.font = `400 13px ${sansFont}`
    item.summaryLines.forEach((line, lineIdx) => {
      ctx.fillText(line, padding + 32, y + 14 + lineIdx * 20)
    })
    y += item.summaryLines.length * 20 + 16

    if (idx < laidOutStories.length - 1) {
      ctx.strokeStyle = '#1e293b'
      ctx.beginPath()
      ctx.moveTo(padding, y - 6)
      ctx.lineTo(width - padding, y - 6)
      ctx.stroke()
      y += 8
    }
  })

  // Footer watermark
  const footerY = height - 48
  ctx.strokeStyle = '#243044'
  ctx.beginPath()
  ctx.moveTo(padding, footerY - 16)
  ctx.lineTo(width - padding, footerY - 16)
  ctx.stroke()

  ctx.fillStyle = '#e2e8f0'
  ctx.font = `600 13px ${sansFont}`
  ctx.fillText('今日热点 AI', padding, footerY + 6)

  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 12px ${monoFont}`
  const footerLink = `${host}/daily/${report.reportDate}`
  const linkWidth = ctx.measureText(footerLink).width
  ctx.fillText(footerLink, Math.max(padding + 90, width - padding - linkWidth), footerY + 6)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG export failed'))
    }, 'image/png')
  })
}

export function DailyShareActions({ report }: { report: DailyReport }) {
  const t = useTranslations('daily')
  const tCommon = useTranslations('common')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [modalOpen, setModalOpen] = useState(false)
  const [cardState, setCardState] = useState<'idle' | 'generating' | 'ready' | 'failed'>('idle')
  const [cardUrl, setCardUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (cardUrl) URL.revokeObjectURL(cardUrl)
    }
  }, [cardUrl])

  async function handleCopy() {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined
      await navigator.clipboard.writeText(formatDailyBriefingText(report, origin))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 2500)
  }

  const generateCard = useCallback(async () => {
    setCardState('generating')
    try {
      const host = typeof window !== 'undefined' ? window.location.host : 'news.ljhboard.cn'
      const blob = await renderDailyShareCard(report, host)
      const url = URL.createObjectURL(blob)
      setCardUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
      setCardState('ready')
    } catch {
      setCardState('failed')
    }
  }, [report])

  function handleOpenCard() {
    setModalOpen(true)
    void generateCard()
  }

  function handleDownload() {
    if (!cardUrl) return
    const link = document.createElement('a')
    link.href = cardUrl
    link.download = `daily-briefing-${report.reportDate}.png`
    link.click()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton
          variant="outline"
          className="min-h-8 h-8 px-2.5 text-xs"
          onPress={() => void handleCopy()}
        >
          {copyState === 'copied' ? (
            <Check className="size-3.5 text-primary" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          <span>
            {copyState === 'copied'
              ? t('copiedBriefing')
              : copyState === 'failed'
                ? t('copyFailed')
                : t('copyBriefing')}
          </span>
        </ActionButton>
        <ActionButton
          variant="outline"
          className="min-h-8 h-8 px-2.5 text-xs"
          onPress={handleOpenCard}
        >
          <ImageIcon className="size-3.5" aria-hidden="true" />
          <span>{t('shareCard')}</span>
        </ActionButton>
      </div>

      <ModalOverlay
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      >
        <Modal className="w-full max-w-md overflow-hidden rounded-sm border border-strong bg-popover text-popover-foreground shadow-2xl">
          <Dialog className="max-h-[calc(var(--visual-viewport-height,100dvh)-2rem)] overflow-y-auto p-5 outline-none slim-scrollbar">
            {({ close }) => (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <Heading slot="title" className="text-base font-semibold text-foreground">
                    {t('shareCardTitle')}
                  </Heading>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    aria-label={tCommon('closeDialog')}
                    onPress={close}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </ActionButton>
                </div>

                <div className="mt-4">
                  {cardState === 'generating' && (
                    <div className="flex min-h-60 items-center justify-center rounded-sm border border-border bg-card p-6 font-mono text-xs text-muted-foreground">
                      {t('generatingCard')}
                    </div>
                  )}
                  {cardState === 'failed' && (
                    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-sm border border-border bg-card p-6 text-center">
                      <p className="text-sm text-muted-foreground">{t('cardFailed')}</p>
                      <ActionButton
                        variant="outline"
                        className="h-9 px-3 text-xs"
                        onPress={() => void generateCard()}
                      >
                        <RefreshCw className="size-3.5" aria-hidden="true" />
                        <span>{tCommon('retry')}</span>
                      </ActionButton>
                    </div>
                  )}
                  {cardState === 'ready' && cardUrl && (
                    <div className="space-y-4">
                      {/* biome-ignore lint/performance/noImgElement: Blob URL generated on the client canvas */}
                      <img
                        src={cardUrl}
                        alt={t('cardPreviewAlt', { date: report.reportDate })}
                        className="w-full rounded-sm border border-border"
                      />
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          variant="outline"
                          className="h-9 px-3 text-xs"
                          onPress={close}
                        >
                          {tCommon('cancel')}
                        </ActionButton>
                        <ActionButton className="h-9 px-3 text-xs" onPress={handleDownload}>
                          <Download className="size-3.5" aria-hidden="true" />
                          <span>{t('downloadCard')}</span>
                        </ActionButton>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}
