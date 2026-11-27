import {
  ALLOWED_THUMBNAIL_SIZES,
  buildImgproxyRequestUrl,
  decodeBase64UrlParam,
  getImageProxySigningSecret,
  isSafeExternalImageUrl,
  verifyImageProxySignature
} from '../../../lib/image-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

export async function GET(request: Request) {
  const imgproxyUrl = process.env.IMGPROXY_URL?.trim()
  const secret = getImageProxySigningSecret()
  if (!imgproxyUrl || !secret) {
    return new Response('Image proxy unavailable', { status: 503, headers: NO_STORE_HEADERS })
  }

  const { searchParams } = new URL(request.url)
  const encodedUrl = searchParams.get('u') ?? ''
  const width = Number.parseInt(searchParams.get('w') ?? '', 10)
  const height = Number.parseInt(searchParams.get('h') ?? '', 10)
  const sig = searchParams.get('s') ?? ''

  if (!ALLOWED_THUMBNAIL_SIZES.has(`${width}x${height}`)) {
    return new Response('Invalid dimensions', { status: 400, headers: NO_STORE_HEADERS })
  }

  const targetUrl = decodeBase64UrlParam(encodedUrl)
  if (!targetUrl || !isSafeExternalImageUrl(targetUrl)) {
    return new Response('Invalid image URL', { status: 400, headers: NO_STORE_HEADERS })
  }

  if (!verifyImageProxySignature(targetUrl, width, height, sig, secret)) {
    return new Response('Invalid signature', { status: 403, headers: NO_STORE_HEADERS })
  }

  try {
    const upstream = await fetch(buildImgproxyRequestUrl(imgproxyUrl, targetUrl, width, height), {
      headers: { Accept: 'image/webp,*/*;q=0.8' },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000)
    })
    const contentType = upstream.headers.get('content-type') ?? ''
    if (!upstream.ok || !contentType.startsWith('image/')) {
      return new Response('Upstream image error', { status: 502, headers: NO_STORE_HEADERS })
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  } catch {
    return new Response('Image proxy timeout', { status: 502, headers: NO_STORE_HEADERS })
  }
}
