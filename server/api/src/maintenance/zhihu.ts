import { encryptZseV4 } from './zse-v4.js'

const origin = 'https://www.zhihu.com'
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
// Public web-client protocol identifiers, not account credentials.
const clientId = 'c3cef7c66a1843f8b3a9e6a1e3160e20'
const clientSecret = 'd1b964811afb40118a12068ff74a12f4'

export class RefreshError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

export type Request = typeof fetch

export async function requestJson(request: Request, url: string, init: RequestInit = {}) {
  const response = await request(url, {
    ...init,
    redirect: 'error',
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) {
    await response.body?.cancel()
    throw new RefreshError(`upstream_http_${response.status}`)
  }
  return response
}

function headers(cookie: string) {
  return {
    Cookie: cookie,
    'User-Agent': userAgent,
    Origin: origin,
    Referer: `${origin}/signin`,
    'x-requested-with': 'fetch',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
  }
}

export function cookieValue(cookie: string, name: string) {
  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

export async function refreshZhihuCookie(
  cookie: string,
  request: Request = fetch,
  now = Date.now()
) {
  if (!cookieValue(cookie, 'z_c0') || /[\r\n]/.test(cookie))
    throw new RefreshError('invalid_cookie')
  const first = await requestJson(request, `${origin}/api/account/prod/token/refresh`, {
    method: 'POST',
    headers: headers(cookie)
  })
  const data = (await first.json()) as { refresh_token?: unknown }
  if (typeof data.refresh_token !== 'string' || !data.refresh_token.trim()) {
    throw new RefreshError('missing_refresh_token')
  }
  const timestamp = String(now)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`refresh_token${clientId}com.zhihu.web${timestamp}`)
  )
  const signature = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
  const form = Object.entries({
    client_id: clientId,
    grant_type: 'refresh_token',
    timestamp,
    source: 'com.zhihu.web',
    signature,
    refresh_token: data.refresh_token
  })
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  const second = await requestJson(request, `${origin}/api/v3/oauth/sign_in`, {
    method: 'POST',
    headers: { ...headers(cookie), 'x-zse-83': '3_3.0' },
    body: encryptZseV4(form)
  })
  const setCookie = second.headers
    .getSetCookie()
    .filter((line) => line.startsWith('z_c0='))
    .at(-1)
  await second.body?.cancel()
  const login = setCookie?.match(/^z_c0=([^;]*)/)?.[1]
  const maxAge = setCookie?.match(/;\s*max-age=(-?\d+)/i)?.[1]
  const expires = setCookie?.match(/;\s*expires=([^;]+)/i)?.[1]
  if (
    !login ||
    ['deleted', 'null', '""'].includes(login.toLowerCase()) ||
    (maxAge !== undefined && Number(maxAge) <= 0) ||
    (maxAge === undefined && expires !== undefined && Date.parse(expires) <= now)
  )
    throw new RefreshError('missing_new_cookie')
  return cookie
    .split(';')
    .map((part) => (part.trim().startsWith('z_c0=') ? `z_c0=${login}` : part.trim()))
    .join('; ')
}

export async function zhihuAccount(cookie: string, request: Request = fetch): Promise<string> {
  const response = await requestJson(request, `${origin}/api/v4/me?include=is_realname`, {
    headers: headers(cookie)
  })
  const data = (await response.json()) as { id?: unknown }
  if (typeof data.id !== 'string' || !data.id) throw new RefreshError('invalid_identity')
  return data.id
}
