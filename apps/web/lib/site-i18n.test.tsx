// @vitest-environment jsdom
import { signalSections, signalSources } from '@rss-site/signals'
import { createTranslator, useTranslations } from 'next-intl'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FormattedDate,
  SiteLanguageProvider,
  TranslatedText,
  useLanguagePreference,
  useSiteLocale
} from '../components/site-language'
import { DEFAULT_TIME_ZONE } from '../lib/site-locale'
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

function extractIcuTokens(message: string): { args: string[]; tags: string[] } {
  const args = new Set<string>()
  const tags = new Set<string>()
  let depth = 0
  let inQuotes = false

  for (let i = 0; i < message.length; i++) {
    const ch = message[i]
    if (ch === "'") {
      if (message[i + 1] === "'") {
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (inQuotes) continue

    if (ch === '{') {
      if (depth === 0) {
        const match = message.slice(i + 1).match(/^\s*([a-zA-Z0-9_]+)\s*(?:[,}])/)
        if (match) args.add(match[1])
      }
      depth++
    } else if (ch === '}') {
      depth = Math.max(0, depth - 1)
    } else if (ch === '<' && depth === 0) {
      const tagMatch = message.slice(i + 1).match(/^\/([a-zA-Z0-9_]+)>/)
      if (tagMatch) tags.add(tagMatch[1])
    }
  }

  return { args: [...args].sort(), tags: [...tags].sort() }
}

describe('next-intl message catalogs', () => {
  it('keeps zh-CN and en message keys, ICU arguments, tags, and syntax strictly valid and aligned', () => {
    const zhEntries = flattenMessages(zhCNMessages)
    const enEntries = flattenMessages(enMessages)
    const zhMap = new Map(zhEntries)
    const enMap = new Map(enEntries)

    expect(zhEntries.map(([key]) => key)).toEqual(enEntries.map(([key]) => key))

    const translators = {
      'zh-CN': createTranslator({
        locale: 'zh-CN',
        messages: zhCNMessages,
        timeZone: DEFAULT_TIME_ZONE,
        onError: (error) => {
          throw error
        }
      }),
      en: createTranslator({
        locale: 'en',
        messages: enMessages,
        timeZone: DEFAULT_TIME_ZONE,
        onError: (error) => {
          throw error
        }
      })
    }

    for (const [key, zhValue] of zhMap) {
      const enValue = enMap.get(key)
      expect(zhValue.trim().length, `empty zh-CN message for ${key}`).toBeGreaterThan(0)
      expect(enValue?.trim().length, `empty en message for ${key}`).toBeGreaterThan(0)

      const zhTokens = extractIcuTokens(zhValue)
      const enTokens = extractIcuTokens(enValue ?? '')
      expect(enTokens, `ICU tokens mismatch for ${key}`).toEqual(zhTokens)

      // Compile and execute every message through next-intl's real ICU parser
      const values: Record<string, string | number | ((chunks: ReactNode) => ReactNode)> = {}
      for (const arg of zhTokens.args) values[arg] = 1
      for (const tag of zhTokens.tags) values[tag] = (chunks: ReactNode) => chunks

      for (const [locale, t] of Object.entries(translators)) {
        const rendered =
          zhTokens.tags.length > 0
            ? (t.rich as (k: string, v: Record<string, unknown>) => unknown)(key, values)
            : (t as (k: string, v?: Record<string, unknown>) => string)(
                key,
                zhTokens.args.length > 0 ? values : undefined
              )
        expect(rendered, `failed to compile ${locale}:${key}`).toBeTruthy()
      }
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
