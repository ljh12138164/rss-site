import { signalSections } from '@rss-site/signals'

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

export type OutboundReturnPath = '/' | (typeof signalSections)[number]['path']

const allowedReturnPaths = new Set<string>(['/', ...signalSections.map((s) => s.path)])

export function resolveOutboundReturnPath(value: string): OutboundReturnPath {
  return allowedReturnPaths.has(value) ? (value as OutboundReturnPath) : '/technology'
}
