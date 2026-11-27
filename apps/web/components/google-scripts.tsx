'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

export function GoogleScripts({ pathname: propPathname }: { pathname?: string } = {}) {
  const navPathname = usePathname()
  const currentPath = propPathname ?? navPathname ?? ''
  const isOutbound = currentPath === '/out' || currentPath.startsWith('/out/')

  if (isOutbound) {
    return null
  }

  return (
    <>
      <Script id="umami-before-send" strategy="beforeInteractive">
        {`window.umamiBeforeSend=function(type,payload){if(payload&&payload.url&&(payload.url==='/out'||payload.url.startsWith('/out?')||payload.url.startsWith('/out/')))return false;return payload;};`}
      </Script>
      <Script
        id="umami-analytics"
        defer
        src="/stats/script.js"
        data-website-id="9347c606-1b27-41fb-94a2-c124d3054d85"
        data-before-send="umamiBeforeSend"
        strategy="afterInteractive"
      />
      {/* <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7441827328189379"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      /> */}
    </>
  )
}
