import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CctvVideoPlayer } from './cctv-video-player'

describe('CctvVideoPlayer', () => {
  it('renders initial loading state during SSR', () => {
    const html = renderToStaticMarkup(<CctvVideoPlayer pid="fdec9a65d6a34784bec390395b9431f2" />)
    expect(html).toContain('正在加载央视新闻视频...')
    expect(html).toContain('aspect-video')
  })

  it('applies vertical aspect ratio when type is 6', () => {
    const html = renderToStaticMarkup(
      <CctvVideoPlayer pid="fdec9a65d6a34784bec390395b9431f2" type="6" />
    )
    expect(html).toContain('aspect-[9/16]')
  })
})
