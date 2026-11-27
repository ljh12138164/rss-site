import { createHmac, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'

export const ALLOWED_THUMBNAIL_SIZES = new Set(['320x200'])
const MAX_IMAGE_URL_LENGTH = 2048

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255))
    return true
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

export function isSafeExternalImageUrl(rawUrl: string): boolean {
  if (!rawUrl || rawUrl.length > MAX_IMAGE_URL_LENGTH) return false
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  if (parsed.username || parsed.password) return false
  if (parsed.pathname.toLowerCase().endsWith('.svg')) return false

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '')
  if (!hostname || hostname.includes(':')) return false
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  )
    return false

  const ipVersion = isIP(hostname)
  if (ipVersion === 6) return false
  if (ipVersion === 4) return !isPrivateOrReservedIpv4(hostname)
  if (!hostname.includes('.')) return false

  return true
}

export function getImageProxySigningSecret(): string {
  return (
    process.env.IMGPROXY_SIGNING_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    process.env.MAINTENANCE_ENCRYPTION_KEY?.trim() ||
    ''
  )
}

export function signImageProxyParams(
  url: string,
  width: number,
  height: number,
  secret: string
): string {
  return createHmac('sha256', secret)
    .update(`img:${width}x${height}:${url}`)
    .digest('base64url')
    .slice(0, 22)
}

export function verifyImageProxySignature(
  url: string,
  width: number,
  height: number,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false
  const expected = signImageProxyParams(url, width, height, secret)
  const actualBuf = Buffer.from(signature, 'utf8')
  const expectedBuf = Buffer.from(expected, 'utf8')
  if (actualBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(actualBuf, expectedBuf)
}

export function createThumbnailProxyUrl(
  rawUrl?: string | null,
  width = 320,
  height = 200
): string | null {
  if (!process.env.IMGPROXY_URL?.trim()) return null
  const trimmed = rawUrl?.trim()
  if (!trimmed) return null
  if (!ALLOWED_THUMBNAIL_SIZES.has(`${width}x${height}`)) return null
  if (!isSafeExternalImageUrl(trimmed)) return null
  const secret = getImageProxySigningSecret()
  if (!secret) return null
  const encoded = Buffer.from(trimmed, 'utf8').toString('base64url')
  const sig = signImageProxyParams(trimmed, width, height, secret)
  return `/api/img?u=${encodeURIComponent(encoded)}&w=${width}&h=${height}&s=${encodeURIComponent(sig)}`
}

export function decodeBase64UrlParam(encoded: string): string | null {
  if (!encoded || encoded.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null
  try {
    return Buffer.from(encoded, 'base64url').toString('utf8')
  } catch {
    return null
  }
}

export function buildImgproxyRequestUrl(
  imgproxyBase: string,
  targetUrl: string,
  width: number,
  height: number
): string {
  const base = imgproxyBase.trim().replace(/\/+$/, '')
  const encoded = Buffer.from(targetUrl, 'utf8').toString('base64url')
  return `${base}/insecure/rs:fill:${width}:${height}/q:80/f:webp/${encoded}`
}
