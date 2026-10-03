export function estimateReadingMinutes(html: string): number | null {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, ' ')
  const characters = text.match(/\p{Script=Han}/gu)?.length ?? 0
  const words = text.replace(/\p{Script=Han}/gu, ' ').match(/[\p{L}\p{N}]+/gu)?.length ?? 0
  return characters || words ? Math.max(1, Math.ceil(characters / 350 + words / 200)) : null
}

const key = 'rss_site_reading_progress_v1'
interface Position {
  ratio: number
  at: number
}

function positions(): Record<string, Position> {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

export function getReadingPosition(id: string): number | null {
  const value = positions()[id]?.ratio
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 0.98
    ? value
    : null
}

export function saveReadingPosition(id: string, ratio: number): boolean {
  if (!id || !Number.isFinite(ratio)) return false
  try {
    const all = positions()
    all[id] = { ratio: Math.max(0, Math.min(1, ratio)), at: Date.now() }
    const latest = Object.entries(all)
      .filter(([, value]) => value && Number.isFinite(value.at))
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, 100)
    window.localStorage.setItem(key, JSON.stringify(Object.fromEntries(latest)))
    return true
  } catch {
    return false
  }
}
