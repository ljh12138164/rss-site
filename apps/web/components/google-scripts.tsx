import Script from 'next/script'

export function GoogleScripts() {
  const ga = process.env.NEXT_PUBLIC_GA_ID
  return (
    <>
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
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?d906269be472d4daeba2a571af55c48c";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();`}
      </Script>
    </>
  )
}
