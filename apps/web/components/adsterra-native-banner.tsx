'use client'

import { useEffect, useRef } from 'react'

const CONTAINER_ID = 'container-dbe8d6056eda1c6cbeb39ecf76bad967'
const SCRIPT_SRC = 'https://bauval.org/21/dbe8d6056eda1c6cbeb39ecf76bad967'

export function AdsterraNativeBanner() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = containerRef.current
    if (!host) return

    host.innerHTML = ''

    const adContainer = document.createElement('div')
    adContainer.id = CONTAINER_ID
    host.appendChild(adContainer)

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    host.appendChild(script)

    return () => {
      host.innerHTML = ''
    }
  }, [])

  return (
    <section
      aria-label="赞助商推荐"
      className="my-8 w-full overflow-hidden rounded-xl border border-border/60 bg-card/40 p-4 text-center transition-colors"
    >
      <div className="mb-2.5 flex items-center justify-center gap-1.5 font-mono text-[11px] text-muted-foreground/70">
        <span>赞助商推荐</span>
      </div>
      <div ref={containerRef} className="min-h-[120px] w-full" />
    </section>
  )
}
