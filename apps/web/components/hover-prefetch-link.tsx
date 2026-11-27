'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ComponentProps, type FocusEvent, type MouseEvent, useRef } from 'react'

type HoverPrefetchLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  href: string
}

export function HoverPrefetchLink({
  href,
  onMouseEnter,
  onFocus,
  ...props
}: HoverPrefetchLinkProps) {
  const router = useRouter()
  const prefetchedHrefRef = useRef<string | null>(null)
  const isCurrentPage = props['aria-current'] === 'page' || props['aria-current'] === 'date'

  const triggerPrefetch = () => {
    if (isCurrentPage || prefetchedHrefRef.current === href) return
    prefetchedHrefRef.current = href
    router.prefetch(href)
  }

  const handleMouseEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    triggerPrefetch()
    onMouseEnter?.(event)
  }

  const handleFocus = (event: FocusEvent<HTMLAnchorElement>) => {
    triggerPrefetch()
    onFocus?.(event)
  }

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    />
  )
}
