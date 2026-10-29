// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdsterraBanner320 } from './adsterra-banner-320'
import { AdsterraNativeBanner } from './adsterra-native-banner'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Adsterra Ads Components', () => {
  describe('AdsterraNativeBanner', () => {
    it('renders server-side static markup with placeholder and label', () => {
      const html = renderToStaticMarkup(<AdsterraNativeBanner />)
      expect(html).toContain('aria-label="赞助商推荐"')
      expect(html).toContain('赞助商推荐')
      expect(html).toContain('min-h-[120px]')
    })

    it('injects container and async script on client mount and cleans up on unmount', async () => {
      await act(async () => {
        root.render(<AdsterraNativeBanner />)
      })

      const adContainer = container.querySelector('#container-dbe8d6056eda1c6cbeb39ecf76bad967')
      expect(adContainer).not.toBeNull()

      const script = container.querySelector(
        'script[src="https://bauval.org/21/dbe8d6056eda1c6cbeb39ecf76bad967"]'
      )
      expect(script).not.toBeNull()
      expect(script?.getAttribute('data-cfasync')).toBe('false')

      await act(async () => {
        root.unmount()
      })
      expect(container.querySelector('#container-dbe8d6056eda1c6cbeb39ecf76bad967')).toBeNull()
    })
  })

  describe('AdsterraBanner320', () => {
    it('renders server-side static markup with md:hidden responsive scope', () => {
      const html = renderToStaticMarkup(<AdsterraBanner320 />)
      expect(html).toContain('aria-label="移动端赞助商内容"')
      expect(html).toContain('md:hidden')
      expect(html).toContain('广告赞助')
    })

    it('injects iframe config and invoke script on client mount', async () => {
      await act(async () => {
        root.render(<AdsterraBanner320 />)
      })

      const scripts = container.querySelectorAll('script')
      expect(scripts.length).toBeGreaterThanOrEqual(2)

      const invokeScript = container.querySelector(
        'script[src="https://bauval.org/22/b2067460601c71f2427a266d44f5a43d"]'
      )
      expect(invokeScript).not.toBeNull()

      const textScript = Array.from(scripts).find((s) =>
        s.textContent?.includes('b2067460601c71f2427a266d44f5a43d')
      )
      expect(textScript).toBeDefined()
    })
  })
})
