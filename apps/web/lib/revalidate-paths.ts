export interface RevalidationScope {
  section?: string
  source?: string
  eventSlugs?: string[]
}

export interface ResolvedRevalidation {
  paths: string[]
  dynamicPages: string[]
  tags: string[]
}

/**
 * Resolves static paths, dynamic page patterns, and cache tags to revalidate.
 */
export function resolveRevalidation(scope: RevalidationScope): ResolvedRevalidation {
  const { section, source, eventSlugs = [] } = scope
  const tags: string[] = []

  if (section === '/ai' || eventSlugs.length) {
    tags.push('event-status')
  }
  if (section && source) {
    tags.push(`news-status:${source}`)
  }

  const paths: string[] = ['/', '/sitemap.xml']

  if (source === 'github') {
    paths.push('/github')
  } else if (section === '/skills') {
    paths.push('/skills')
  } else if (section) {
    paths.push(section)
    if (source) {
      paths.push(`${section}/${source}`)
    }
  }

  for (const slug of eventSlugs) {
    paths.push(`/ai/events/${slug}`)
  }

  if (section === '/ai' || eventSlugs.length) {
    paths.push('/ai/events')
  }

  const dynamicPages: string[] = []
  if (section === '/ai' || eventSlugs.length) {
    dynamicPages.push('/ai/events/[slug]')
  }
  if (section && source !== 'github' && section !== '/skills') {
    dynamicPages.push(`${section}/${source}/[slug]`)
  }

  return {
    paths: [...new Set(paths)],
    dynamicPages: [...new Set(dynamicPages)],
    tags: [...new Set(tags)]
  }
}
