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

  const ga = process.env.NEXT_PUBLIC_GA_ID
  return (
    <>
      <Script id="umami-before-send" strategy="beforeInteractive">
        {`window.umamiBeforeSend=function(type,payload){if(payload&&payload.url&&(payload.url==='/out'||payload.url.startsWith('/out?')||payload.url.startsWith('/out/')))return false;return payload;};`}
      </Script>
      {ga && /^G-[A-Z0-9]+$/.test(ga) && (
        <>
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
        </>
      )}
      <Script
        id="umami-analytics"
        defer
        src="/stats/script.js"
        data-website-id="9347c606-1b27-41fb-94a2-c124d3054d85"
        data-before-send="umamiBeforeSend"
        strategy="afterInteractive"
      />
      <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7441827328189379"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <Script id="baidu-tongji" strategy="afterInteractive">
        {`var _hmt = _hmt || [];
(function() {
  if (window.location.pathname === '/out' || window.location.pathname.startsWith('/out/')) return;
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?d906269be472d4daeba2a571af55c48c";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();`}
      </Script>
    </>
  )
}
