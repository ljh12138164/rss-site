'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

export function MonetagScript({ pathname: propPathname }: { pathname?: string } = {}) {
  const navPathname = usePathname()
  const currentPath = propPathname ?? navPathname ?? ''
  const isExcluded =
    currentPath === '/out' ||
    currentPath.startsWith('/out/') ||
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/')

  if (isExcluded) {
    return null
  }

  return (
    <Script
      id="monetag-in-page-push"
      src="https://nap5k.com/tag.min.js"
      data-zone="12146846"
      data-cfasync="false"
      strategy="afterInteractive"
    />
  )
}
