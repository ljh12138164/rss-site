// @vitest-environment jsdom
import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HoverPrefetchLink } from './hover-prefetch-link'

const mocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  linkPrefetchProps: [] as Array<boolean | 'auto' | null | undefined>
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: mocks.prefetch })
}))

vi.mock('next/link', () => ({
  default: ({
    prefetch,
    href,
    children,
    ...rest
  }: ComponentProps<'a'> & { prefetch?: boolean | 'auto' | null }) => {
    mocks.linkPrefetchProps.push(prefetch)
    return (
      <a href={href} data-prefetch={String(prefetch)} {...rest}>
        {children}
      </a>
    )
  }
}))

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.prefetch.mockReset()
  mocks.linkPrefetchProps.length = 0
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

it('disables automatic viewport prefetch and prefetches once on hover', async () => {
  const onMouseEnter = vi.fn()
  await act(async () => {
    root.render(
      <HoverPrefetchLink href="/ai" onMouseEnter={onMouseEnter}>
        AI
      </HoverPrefetchLink>
    )
  })

  const anchor = container.querySelector('a')
  expect(anchor?.getAttribute('data-prefetch')).toBe('false')
  expect(mocks.linkPrefetchProps).toEqual([false])
  expect(mocks.prefetch).not.toHaveBeenCalled()

  await act(async () => {
    anchor?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  })
  expect(mocks.prefetch).toHaveBeenCalledTimes(1)
  expect(mocks.prefetch).toHaveBeenCalledWith('/ai')
  expect(onMouseEnter).toHaveBeenCalledTimes(1)

  await act(async () => {
    anchor?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    anchor?.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
  })
  expect(mocks.prefetch).toHaveBeenCalledTimes(1)
})

it('prefetches on keyboard focus and re-prefetches when href changes', async () => {
  const onFocus = vi.fn()
  await act(async () => {
    root.render(
      <HoverPrefetchLink href="/daily" onFocus={onFocus}>
        Daily
      </HoverPrefetchLink>
    )
  })

  const anchor = container.querySelector('a')
  await act(async () => {
    anchor?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  })
  expect(mocks.prefetch).toHaveBeenCalledTimes(1)
  expect(mocks.prefetch).toHaveBeenCalledWith('/daily')
  expect(onFocus).toHaveBeenCalledTimes(1)

  await act(async () => {
    root.render(
      <HoverPrefetchLink href="/news" onFocus={onFocus}>
        News
      </HoverPrefetchLink>
    )
  })
  await act(async () => {
    anchor?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  })
  expect(mocks.prefetch).toHaveBeenCalledTimes(2)
  expect(mocks.prefetch).toHaveBeenLastCalledWith('/news')
})

it('skips prefetching for the active current page link', async () => {
  await act(async () => {
    root.render(
      <HoverPrefetchLink href="/ai" aria-current="page">
        AI
      </HoverPrefetchLink>
    )
  })

  const anchor = container.querySelector('a')
  await act(async () => {
    anchor?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    anchor?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  })
  expect(mocks.prefetch).not.toHaveBeenCalled()
})
