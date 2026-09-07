export function siteUrl(path = '/') {
  const configured = process.env.SITE_URL
  if (!configured) throw new Error('SITE_URL is required for canonical URLs and sitemap')
  const base = new URL(configured)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password)
    throw new Error('Invalid SITE_URL')
  return new URL(path, base.origin).toString()
}

export function optionalCanonical(path: string) {
  return process.env.SITE_URL ? siteUrl(path) : undefined
}
