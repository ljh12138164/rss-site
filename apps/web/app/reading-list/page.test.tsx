import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReadingListPage from './page'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string; [key: string]: unknown }) => (
    <span data-src={src} data-alt={alt ?? ''} />
  )
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/reading-list' }))
vi.mock('../../components/article-search', () => ({ ArticleSearch: () => null }))
vi.mock('../../components/theme-toggle', () => ({ ThemeToggle: () => null }))

describe('ReadingListPage', () => {
  beforeEach(() => {
    global.window = {
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    } as unknown as Window & typeof globalThis
  })

  it('renders title, subtitle, tabs, and initial empty state', () => {
    const html = renderToStaticMarkup(<ReadingListPage />)
    expect(html).toContain('稍后读与阅读足迹')
    expect(html).toContain('稍后阅读')
    expect(html).toContain('历史足迹')
    expect(html).toContain('暂无稍后阅读文章')
  })
})
