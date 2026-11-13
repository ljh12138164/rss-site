// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RssSubscription } from '../rss-subscription'
import { UiSegmentedGroup } from './segmented-group'
import { UiSelect } from './select'

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
  vi.unstubAllGlobals()
})

it('UiSelect handles empty-string sentinel options cleanly', async () => {
  const onSelect = vi.fn()
  function Harness() {
    const [value, setValue] = useState('')
    return (
      <UiSelect
        label="频道"
        value={value}
        onChange={(next) => {
          setValue(next)
          onSelect(next)
        }}
        options={[
          { value: '', label: '全部频道' },
          { value: 'ai', label: 'AI' },
          { value: 'tech', label: '科技' }
        ]}
      />
    )
  }

  await act(async () => root.render(<Harness />))
  const trigger = container.querySelector('button')
  expect(trigger?.textContent).toContain('全部频道')

  await act(async () => trigger?.click())
  const aiOption = Array.from(document.body.querySelectorAll('[role="option"]')).find(
    (node) => node.textContent === 'AI'
  ) as HTMLElement | undefined
  expect(aiOption).toBeTruthy()
  await act(async () => aiOption?.click())
  expect(onSelect).toHaveBeenLastCalledWith('ai')
  expect(trigger?.textContent).toContain('AI')

  await act(async () => trigger?.click())
  const allOption = Array.from(document.body.querySelectorAll('[role="option"]')).find(
    (node) => node.textContent === '全部频道'
  ) as HTMLElement | undefined
  expect(allOption).toBeTruthy()
  await act(async () => allOption?.click())
  expect(onSelect).toHaveBeenLastCalledWith('')
  expect(trigger?.textContent).toContain('全部频道')
})

it('UiSegmentedGroup preserves single active selection', async () => {
  function Harness() {
    const [view, setView] = useState<'list' | 'cards'>('list')
    return (
      <>
        <UiSegmentedGroup
          ariaLabel="展示方式"
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: '列表' },
            { value: 'cards', label: '卡片' }
          ]}
        />
        <span data-testid="view">{view}</span>
      </>
    )
  }

  await act(async () => root.render(<Harness />))
  expect(container.querySelector('[data-testid="view"]')?.textContent).toBe('list')

  const cardsBtn = Array.from(container.querySelectorAll('button')).find(
    (node) => node.textContent === '卡片'
  )
  expect(cardsBtn).toBeTruthy()
  await act(async () => cardsBtn?.click())
  expect(container.querySelector('[data-testid="view"]')?.textContent).toBe('cards')

  // Clicking the active option again must not clear selection.
  await act(async () => cardsBtn?.click())
  expect(container.querySelector('[data-testid="view"]')?.textContent).toBe('cards')
})

it('RssSubscription switches modes, selects sources, updates feed URL and clears selection', async () => {
  await act(async () => root.render(<RssSubscription basePath="/ai" sectionName="AI" />))

  const openButton = container.querySelector('button[aria-label="订阅 AI RSS"]') as
    | HTMLButtonElement
    | undefined
  expect(openButton).toBeTruthy()
  await act(async () => openButton?.click())

  const dialog = document.body.querySelector('[role="dialog"]')
  expect(dialog).toBeTruthy()

  const addressInput = dialog?.querySelector('#rss-address') as HTMLInputElement | null
  expect(addressInput?.value).toMatch(/\/feeds\/ai\.xml$/)

  const copyButton = Array.from(dialog?.querySelectorAll('button') ?? []).find((btn) =>
    btn.textContent?.includes('复制')
  ) as HTMLButtonElement | undefined
  expect(copyButton?.disabled).toBe(false)

  const customRadio = Array.from(dialog?.querySelectorAll('input[type="radio"]') ?? [])[1] as
    | HTMLInputElement
    | undefined
  expect(customRadio).toBeTruthy()
  await act(async () => customRadio?.click())

  expect(dialog?.textContent).toContain('已选 0 /')
  expect(addressInput?.value).toBe('')
  expect(copyButton?.disabled).toBe(true)

  const checkboxes = Array.from(
    dialog?.querySelectorAll('input[type="checkbox"]') ?? []
  ) as HTMLInputElement[]
  expect(checkboxes.length).toBeGreaterThanOrEqual(2)
  await act(async () => checkboxes[0]?.click())

  expect(dialog?.textContent).toContain('已选 1 /')
  expect(addressInput?.value).toMatch(/\/feeds\/[a-z0-9-]+\.xml$/)
  expect(copyButton?.disabled).toBe(false)

  await act(async () => checkboxes[1]?.click())
  expect(dialog?.textContent).toContain('已选 2 /')
  expect(addressInput?.value).toMatch(/\/feeds\/custom\.xml\?sources=/)

  const clearButton = Array.from(dialog?.querySelectorAll('button') ?? []).find(
    (btn) => btn.textContent === '清空选择'
  ) as HTMLButtonElement | undefined
  expect(clearButton).toBeTruthy()
  await act(async () => clearButton?.click())

  expect(dialog?.textContent).toContain('已选 0 /')
  expect(addressInput?.value).toBe('')
  expect(copyButton?.disabled).toBe(true)
})
