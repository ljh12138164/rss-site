// @vitest-environment jsdom
import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { aiSources } from '../lib/technology-sources'
import { HoverPrefetchLink } from './hover-prefetch-link'
import { SiteLanguageProvider } from './site-language'
import { SourceNavigation } from './source-navigation'

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

it.each(['page', 'date'] as const)('skips prefetching for aria-current=%s', async (current) => {
  await act(async () => {
    root.render(
      <HoverPrefetchLink href="/ai" aria-current={current}>
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

it('disables viewport prefetch across SourceNavigation tabs and prefetches inactive tabs on hover', async () => {
  const sampleSources = aiSources.slice(0, 2)
  const activeSource = sampleSources[0]
  const inactiveSource = sampleSources[1]
  await act(async () => {
    root.render(
      <SiteLanguageProvider>
        <SourceNavigation
          active={activeSource.id}
          ariaLabel="AI 来源"
          basePath="/ai"
          sources={sampleSources}
        />
      </SiteLanguageProvider>
    )
  })

  const links = Array.from(container.querySelectorAll('a'))
  expect(links).toHaveLength(3)
  expect(links.every((link) => link.getAttribute('data-prefetch') === 'false')).toBe(true)
  expect(mocks.prefetch).not.toHaveBeenCalled()

  const activeLink = links.find((link) => link.getAttribute('href') === `/ai/${activeSource.id}`)
  const allLink = links.find((link) => link.getAttribute('href') === '/ai')
  const inactiveLink = links.find(
    (link) => link.getAttribute('href') === `/ai/${inactiveSource.id}`
  )

  await act(async () => {
    activeLink?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  })
  expect(mocks.prefetch).not.toHaveBeenCalled()

  await act(async () => {
    allLink?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    inactiveLink?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  })
  expect(mocks.prefetch).toHaveBeenCalledTimes(2)
  expect(mocks.prefetch).toHaveBeenNthCalledWith(1, '/ai')
  expect(mocks.prefetch).toHaveBeenNthCalledWith(2, `/ai/${inactiveSource.id}`)
})
