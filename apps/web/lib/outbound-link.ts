export function resolveOutboundDestination(url: string) {
  try {
    const destination = new URL(url)

    if (destination.protocol !== 'https:' && destination.protocol !== 'http:') {
      return null
    }

    return destination.toString()
  } catch {
    return null
  }
}

export type OutboundReturnPath = '/technology' | '/news' | '/ai' | '/social'

export function resolveOutboundReturnPath(value: string): OutboundReturnPath {
  return value === '/news' || value === '/ai' || value === '/social' ? value : '/technology'
}
