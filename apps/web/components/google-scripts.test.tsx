import type { ScriptProps } from 'next/script'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GoogleScripts } from './google-scripts'

let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname
}))

describe('GoogleScripts', () => {
  it('renders Baidu Tongji analytics script element', () => {
    const element = GoogleScripts()
    expect(element).not.toBeNull()
    if (!element) throw new Error('Expected element')
    const children = (
      Array.isArray(element.props.children)
        ? element.props.children.flat()
        : [element.props.children]
    ).filter(Boolean) as ReactElement<ScriptProps>[]

    const baiduScript = children.find((child) => child.props.id === 'baidu-tongji')
    expect(baiduScript).toBeDefined()
    expect(baiduScript?.props.children).toContain(
      'hm.baidu.com/hm.js?d906269be472d4daeba2a571af55c48c'
    )
    expect(baiduScript?.props.children).toContain('_hmt')
    expect(baiduScript?.props.strategy).toBe('afterInteractive')
  })

  it('renders Umami and Google AdSense script elements', () => {
    const element = GoogleScripts()
    expect(element).not.toBeNull()
    if (!element) throw new Error('Expected element')
    const children = (
      Array.isArray(element.props.children)
        ? element.props.children.flat()
        : [element.props.children]
    ).filter(Boolean) as ReactElement<ScriptProps>[]

    const umamiScript = children.find((child) => child.props.id === 'umami-analytics')
    expect(umamiScript).toBeDefined()
    if (!umamiScript) throw new Error('Expected umamiScript')
    expect(umamiScript.props.src).toBe('/stats/script.js')
    expect((umamiScript.props as Record<string, unknown>)['data-before-send']).toBe(
      'umamiBeforeSend'
    )

    const beforeSendScript = children.find((child) => child.props.id === 'umami-before-send')
    expect(beforeSendScript).toBeDefined()
    expect(beforeSendScript?.props.children).toContain('/out')

    // const adsenseScript = children.find((child) => child.props.id === 'google-adsense')
    // expect(adsenseScript).toBeDefined()
    // expect(adsenseScript?.props.src).toContain('pagead2.googlesyndication.com')
  })

  it('does not render tracking scripts on /out pathname', () => {
    expect(GoogleScripts({ pathname: '/out' })).toBeNull()
    expect(GoogleScripts({ pathname: '/out/sub' })).toBeNull()
    mockPathname = '/out'
    expect(GoogleScripts()).toBeNull()
    mockPathname = '/'
  })
})
