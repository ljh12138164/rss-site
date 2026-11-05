import { createHash, timingSafeEqual } from 'node:crypto'

export function matchesServiceToken(request: Request, expected: string | undefined) {
  const header = request.headers.get('authorization')
  if (!expected || !header?.startsWith('Bearer ')) return false
  return timingSafeEqual(
    createHash('sha256').update(header.slice(7)).digest(),
    createHash('sha256').update(expected).digest()
  )
}
