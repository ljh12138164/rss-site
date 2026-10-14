// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OutboundDialog } from './outbound-dialog'

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

async function openDialog(href: string) {
  await act(async () => {
    root.render(
      <>
        <a data-outbound href={href}>
          查看原文
        </a>
        <OutboundDialog />
      </>
    )
  })
  await act(async () => {
    container.querySelector('a')?.click()
  })
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull()
}

describe('OutboundDialog clicks', () => {
  const destination = 'https://www.anthropic.com/news/genesis-mission-commitment'

  it.each([destination, `/out?url=${encodeURIComponent(destination)}&from=%2Fai`])(
    'opens the destination before closing the dialog for %s',
    async (href) => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => {
        expect(document.querySelector('[role="alertdialog"]')).not.toBeNull()
        return null
      })
      await openDialog(href)
      const link = document.querySelector<HTMLAnchorElement>('[role="alertdialog"] a')
      expect(link?.href).toBe(destination)
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })

      await act(async () => {
        link?.dispatchEvent(click)
      })

      expect(open).toHaveBeenCalledExactlyOnceWith(destination, '_blank', 'noopener,noreferrer')
      expect(click.defaultPrevented).toBe(true)
      expect(document.querySelector('[role="alertdialog"]')).toBeNull()
    }
  )

  it('closes without navigating when cancelled', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    await openDialog(destination)

    await act(async () => {
      document.querySelector<HTMLButtonElement>('[role="alertdialog"] button')?.click()
    })

    expect(open).not.toHaveBeenCalled()
    expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  })
})
