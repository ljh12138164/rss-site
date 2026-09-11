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
      <meta name="msvalidate.01" content="1D97E9469470F8C3242E298438BF37AD" />
      <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7441827328189379"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
    </>
  )
}
