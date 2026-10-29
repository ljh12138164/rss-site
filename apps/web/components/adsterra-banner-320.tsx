'use client'

import { useEffect, useRef } from 'react'

const BANNER_KEY = 'b2067460601c71f2427a266d44f5a43d'
const SCRIPT_SRC = `https://bauval.org/22/${BANNER_KEY}`

export function AdsterraBanner320() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = containerRef.current
    if (!host) return

    host.innerHTML = ''

    const confScript = document.createElement('script')
    confScript.type = 'text/javascript'
    confScript.text = `
      atOptions = {
        'key' : '${BANNER_KEY}',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `

    const invokeScript = document.createElement('script')
    invokeScript.type = 'text/javascript'
    invokeScript.src = SCRIPT_SRC

    host.appendChild(confScript)
    host.appendChild(invokeScript)

    return () => {
      host.innerHTML = ''
    }
  }, [])

  return (
    <aside
      aria-label="移动端赞助商内容"
      className="my-4 flex w-full flex-col items-center justify-center md:hidden"
    >
      <span className="mb-1 font-mono text-[10px] text-muted-foreground/60">广告赞助</span>
      <div
        ref={containerRef}
        className="flex h-[50px] w-[320px] items-center justify-center overflow-hidden"
      />
    </aside>
  )
}
