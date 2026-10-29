import { describe, expect, it, vi } from 'vitest'
import { MonetagScript } from './monetag-script'

let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname
}))

describe('MonetagScript', () => {
  it('renders Monetag In-Page Push script with correct zone and src', () => {
    const element = MonetagScript()
    expect(element).not.toBeNull()
    if (!element) throw new Error('Expected element')
    expect(element.props.id).toBe('monetag-in-page-push')
    expect(element.props.src).toBe('https://nap5k.com/tag.min.js')
    expect(element.props['data-zone']).toBe('12146846')
    expect(element.props['data-cfasync']).toBe('false')
    expect(element.props.strategy).toBe('afterInteractive')
  })

  it('does not render on /out or /admin routes', () => {
    expect(MonetagScript({ pathname: '/out' })).toBeNull()
    expect(MonetagScript({ pathname: '/out/external' })).toBeNull()
    expect(MonetagScript({ pathname: '/admin' })).toBeNull()
    expect(MonetagScript({ pathname: '/admin/dashboard' })).toBeNull()

    mockPathname = '/out'
    expect(MonetagScript()).toBeNull()
    mockPathname = '/admin'
    expect(MonetagScript()).toBeNull()
    mockPathname = '/'
    expect(MonetagScript()).not.toBeNull()
  })
})
