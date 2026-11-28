export function bilibiliPlayerUrl(originalUrl: string): string | null {
  const url = URL.parse(originalUrl)
  if (
    url?.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    !['bilibili.com', 'www.bilibili.com', 'm.bilibili.com'].includes(url.hostname)
  ) {
    return null
  }

  const match = /^\/video\/(BV[A-Za-z0-9]{10}|av[1-9]\d*)\/?$/.exec(url.pathname)
  if (!match) return null

  const player = new URL('https://player.bilibili.com/player.html')
  const id = match[1]
  if (id.startsWith('BV')) {
    player.searchParams.set('bvid', id)
  } else {
    player.searchParams.set('aid', id.slice(2))
  }
  const part = url.searchParams.get('p')
  if (part && /^[1-9]\d*$/.test(part)) player.searchParams.set('p', part)
  player.searchParams.set('autoplay', '1')
  player.searchParams.set('danmaku', '0')
  return player.href
}

export function hasBilibiliDescription(text: string | null | undefined): boolean {
  const value = text?.trim()
  return Boolean(value && value !== '-')
}
