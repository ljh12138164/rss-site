import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../app/api/img/route'
import {
  buildImgproxyRequestUrl,
  createThumbnailProxyUrl,
  isSafeExternalImageUrl
} from './image-proxy'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('image-proxy helpers', () => {
  it('accepts public raster image URLs and rejects private, local, or SVG targets', () => {
    expect(
      isSafeExternalImageUrl(
        'https://imgpai.thepaper.cn/newpai/image/1795711926158.jpg?x-oss-process=image/resize,w_1024'
      )
    ).toBe(true)
    expect(isSafeExternalImageUrl('http://127.0.0.1/secret.png')).toBe(false)
    expect(isSafeExternalImageUrl('http://10.0.0.5/internal.jpg')).toBe(false)
    expect(isSafeExternalImageUrl('http://169.254.169.254/latest/meta-data')).toBe(false)
    expect(isSafeExternalImageUrl('http://172.16.0.2/a.png')).toBe(false)
    expect(isSafeExternalImageUrl('http://192.168.1.10/a.png')).toBe(false)
    expect(isSafeExternalImageUrl('http://[::1]/a.png')).toBe(false)
    expect(isSafeExternalImageUrl('https://localhost/a.png')).toBe(false)
    expect(isSafeExternalImageUrl('http://imgproxy:8080/health')).toBe(false)
    expect(isSafeExternalImageUrl('https://example.com/icon.svg')).toBe(false)
    expect(isSafeExternalImageUrl('https://user:pass@example.com/a.jpg')).toBe(false)
    expect(isSafeExternalImageUrl('/source-icons/ithome.webp')).toBe(false)
  })

  it('signs thumbnail URLs only when IMGPROXY_URL and a server secret are configured', () => {
    const src = 'https://imgpai.thepaper.cn/newpai/image/demo.jpg?x-oss-process=image/resize,w_1024'
    vi.stubEnv('IMGPROXY_URL', '')
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
    expect(createThumbnailProxyUrl(src)).toBeNull()

    vi.stubEnv('IMGPROXY_URL', 'http://imgproxy:8080')
    const signed = createThumbnailProxyUrl(src)
    expect(signed).toMatch(/^\/api\/img\?u=[A-Za-z0-9_-]+&w=320&h=200&s=[A-Za-z0-9_-]{22}$/)
    expect(buildImgproxyRequestUrl('http://imgproxy:8080/', src, 320, 200)).toBe(
      `http://imgproxy:8080/insecure/rs:fill:320:200/q:80/f:webp/${Buffer.from(src, 'utf8').toString('base64url')}`
    )
  })
})

describe('GET /api/img', () => {
  it('validates signature and streams WebP output with long-lived CDN caching', async () => {
    vi.stubEnv('IMGPROXY_URL', 'http://imgproxy:8080')
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
    const src = 'https://imgpai.thepaper.cn/newpai/image/demo.jpg'
    const path = createThumbnailProxyUrl(src)
    expect(path).not.toBeNull()

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([82, 73, 70, 70]), {
        status: 200,
        headers: { 'Content-Type': 'image/webp' }
      })
    )
    vi.stubGlobal('fetch', mockFetch)

    const ok = await GET(new Request(`https://news.ljhboard.cn${path}`))
    expect(ok.status).toBe(200)
    expect(ok.headers.get('content-type')).toBe('image/webp')
    expect(ok.headers.get('cache-control')).toBe(
      'public, max-age=2592000, s-maxage=2592000, immutable'
    )
    expect(mockFetch).toHaveBeenCalledWith(
      buildImgproxyRequestUrl('http://imgproxy:8080', src, 320, 200),
      expect.objectContaining({ redirect: 'error' })
    )

    const tampered = await GET(new Request(`https://news.ljhboard.cn${path}x`))
    expect(tampered.status).toBe(403)
    expect(tampered.headers.get('cache-control')).toBe('no-store')

    const badSize = await GET(
      new Request(
        `https://news.ljhboard.cn/api/img?u=${Buffer.from(src).toString('base64url')}&w=999&h=999&s=bad`
      )
    )
    expect(badSize.status).toBe(400)
  })

  it('returns 502 no-store when imgproxy fails so CoverImage falls back cleanly', async () => {
    vi.stubEnv('IMGPROXY_URL', 'http://imgproxy:8080')
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
    const path = createThumbnailProxyUrl('https://imgpai.thepaper.cn/newpai/image/blocked.jpg')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Forbidden', { status: 403 })))

    const failed = await GET(new Request(`https://news.ljhboard.cn${path}`))
    expect(failed.status).toBe(502)
    expect(failed.headers.get('cache-control')).toBe('no-store')
  })
})
