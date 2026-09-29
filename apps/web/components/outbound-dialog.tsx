'use client'

import { ExternalLink } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { resolveOutboundDestination } from '../lib/outbound-link'
import { actionStyles } from './action-styles'

const OUT_HREF = /^\/out\?/

export function isExternalLink(
  anchor: { hasAttribute: (name: string) => boolean },
  href: string,
  currentOrigin = typeof window !== 'undefined' ? window.location?.origin : ''
) {
  if (OUT_HREF.test(href) || anchor.hasAttribute('data-outbound')) {
    return true
  }
  try {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const origin = new URL(href).origin
      return !currentOrigin || origin !== currentOrigin
    }
  } catch {}
  return false
}

export function OutboundDialogView({
  destination,
  onClose,
  pending
}: {
  destination: string | null
  onClose: () => void
  pending: string | null
}) {
  return (
    <Dialog role="alertdialog" className="outline-none">
      {() => (
        <>
          <Heading slot="title" className="text-lg font-semibold">
            即将离开本站
          </Heading>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            你将访问第三方网站的原文，请注意信息安全。
          </p>
          {destination && (
            <p className="mt-3 line-clamp-2 overflow-hidden font-mono text-xs break-all text-muted-foreground">
              {destination}
            </p>
          )}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button className={actionStyles('outline')} onClick={onClose} type="button">
              取消
            </button>
            <a
              className={actionStyles('primary')}
              href={destination ?? pending ?? '/'}
              target="_blank"
              rel="noreferrer noopener external"
              onClick={onClose}
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              继续访问
            </a>
          </div>
        </>
      )}
    </Dialog>
  )
}

/**
 * Global outbound-link confirmation. Intercepts clicks on external/outbound links
 * anywhere in the shell and asks before leaving. Also maintains backwards
 * compatibility with `/out?url=…` links.
 */
export function OutboundDialog() {
  const [pending, setPending] = useState<string | null>(null)

  const onDocumentClick = useCallback((event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return
    const anchor = (event.target as HTMLElement | null)?.closest('a')
    if (!anchor || anchor.closest('[role="alertdialog"]')) return
    const href = anchor.getAttribute('href')
    if (!href || !isExternalLink(anchor, href)) return
    event.preventDefault()
    setPending(href)
  }, [])

  useEffect(() => {
    document.addEventListener('click', onDocumentClick, true)
    return () => document.removeEventListener('click', onDocumentClick, true)
  }, [onDocumentClick])

  const rawDestination = pending
    ? OUT_HREF.test(pending)
      ? new URLSearchParams(pending.split('?')[1]).get('url')
      : pending
    : null
  const destination = rawDestination ? resolveOutboundDestination(rawDestination) : null

  return (
    <ModalOverlay
      isOpen={pending !== null}
      isDismissable
      onOpenChange={(open) => {
        if (!open) setPending(null)
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
    >
      <Modal className="w-full max-w-md border border-border bg-background p-6 text-foreground shadow-lg">
        <OutboundDialogView
          destination={destination}
          pending={pending}
          onClose={() => setPending(null)}
        />
      </Modal>
    </ModalOverlay>
  )
}
