// @vitest-environment jsdom
import { signalSections, signalSources } from '@rss-site/signals'
import { useTranslations } from 'next-intl'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FormattedDate,
  SiteLanguageProvider,
  TranslatedText,
  useLanguagePreference,
  useSiteLocale
} from '../components/site-language'
import enMessages from '../messages/en.json'
import zhCNMessages from '../messages/zh-CN.json'

function flattenMessages(input: Record<string, unknown>, prefix = ''): Array<[string, string]> {
  const entries: Array<[string, string]> = []
  for (const [key, value] of Object.entries(input)) {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenMessages(value as Record<string, unknown>, nextKey))
    } else if (typeof value === 'string') {
      entries.push([nextKey, value])
    }
  }
  return entries.sort(([a], [b]) => a.localeCompare(b))
}

function extractPlaceholders(message: string): string[] {
  const vars = Array.from(message.matchAll(/\{(\w+)\}/g), (match) => match[1])
  const tags = Array.from(message.matchAll(/<\/([a-zA-Z0-9]+)>/g), (match) => `<${match[1]}>`)
  return [...new Set([...vars, ...tags])].sort()
}

describe('next-intl message catalogs', () => {
  it('keeps zh-CN and en message keys and ICU placeholders strictly aligned', () => {
    const zhEntries = flattenMessages(zhCNMessages)
    const enEntries = flattenMessages(enMessages)
    const zhMap = new Map(zhEntries)
    const enMap = new Map(enEntries)

    expect(zhEntries.map(([key]) => key)).toEqual(enEntries.map(([key]) => key))

    for (const [key, zhValue] of zhMap) {
      const enValue = enMap.get(key)
      expect(zhValue.trim().length, `empty zh-CN message for ${key}`).toBeGreaterThan(0)
      expect(enValue?.trim().length, `empty en message for ${key}`).toBeGreaterThan(0)
      expect(extractPlaceholders(enValue ?? ''), `ICU mismatch for ${key}`).toEqual(
        extractPlaceholders(zhValue)
      )
    }
  })

  it('covers every registered signal section and source in both locales', () => {
    for (const section of signalSections) {
      expect(zhCNMessages.sections[section.id], `missing zh-CN section ${section.id}`).toBeDefined()
      expect(enMessages.sections[section.id], `missing en section ${section.id}`).toBeDefined()
    }
    for (const source of signalSources) {
      expect(
        zhCNMessages.sources[source.id as keyof typeof zhCNMessages.sources],
        `missing zh-CN source ${source.id}`
      ).toBeTruthy()
      expect(
        enMessages.sources[source.id as keyof typeof enMessages.sources],
        `missing en source ${source.id}`
      ).toBeTruthy()
    }
  })
})

describe('SiteLanguageProvider (next-intl)', () => {
  let root: Root
  let container: HTMLDivElement

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    window.localStorage.clear()
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

  function Harness() {
    const locale = useSiteLocale()
    const { preference, setPreference } = useLanguagePreference()
    const tCommon = useTranslations('common')
    return (
      <div>
        <span data-testid="locale">{locale}</span>
        <span data-testid="preference">{preference}</span>
        <span data-testid="client-text">{tCommon('allStories')}</span>
        <span data-testid="bridge-text">
          <TranslatedText id="about.coverageHeading" />
        </span>
        <span data-testid="date">
          <FormattedDate
            date="2026-10-23T08:00:00Z"
            options={{
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              timeZone: 'Asia/Shanghai'
            }}
          />
        </span>
        <button type="button" onClick={() => setPreference('en')}>
          switch-en
        </button>
        <button type="button" onClick={() => setPreference('zh-CN')}>
          switch-zh
        </button>
        <button type="button" onClick={() => setPreference('auto')}>
          switch-auto
        </button>
      </div>
    )
  }

  it('follows browser language in auto mode, switches immediately, and persists manual preference', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])

    await act(async () =>
      root.render(
        <SiteLanguageProvider>
          <Harness />
        </SiteLanguageProvider>
      )
    )

    expect(container.querySelector('[data-testid="locale"]')?.textContent).toBe('en')
    expect(container.querySelector('[data-testid="preference"]')?.textContent).toBe('auto')
    expect(container.querySelector('[data-testid="client-text"]')?.textContent).toBe('All stories')
    expect(container.querySelector('[data-testid="bridge-text"]')?.textContent).toBe(
      'What we cover'
    )
    expect(document.documentElement.lang).toBe('en')

    const zhBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'switch-zh'
    )
    await act(async () => zhBtn?.click())

    expect(container.querySelector('[data-testid="locale"]')?.textContent).toBe('zh-CN')
    expect(container.querySelector('[data-testid="preference"]')?.textContent).toBe('zh-CN')
    expect(container.querySelector('[data-testid="client-text"]')?.textContent).toBe('全部热点')
    expect(container.querySelector('[data-testid="bridge-text"]')?.textContent).toBe('收录范围')
    expect(window.localStorage.getItem('rss-site-language')).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')

    const autoBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'switch-auto'
    )
    await act(async () => autoBtn?.click())

    expect(container.querySelector('[data-testid="locale"]')?.textContent).toBe('en')
    expect(window.localStorage.getItem('rss-site-language')).toBeNull()
    expect(document.documentElement.lang).toBe('en')
  })
})
