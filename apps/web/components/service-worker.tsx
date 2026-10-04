'use client'

import { useEffect } from 'react'

export function ServiceWorker() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator) ||
      !window.isSecureContext
    ) {
      return
    }

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error) => {
      console.warn('Service Worker registration failed', error)
    })
  }, [])

  return null
}
