/**
 * Unified Cache Control and ISR TTL configuration across the application.
 */
export const CACHE_TTL = {
  /** 2 hours (AI feeds, events, sitemap, homepage) */
  SHORT: 7200,
  /** 6 hours (Tech, News, Social, Finance, Games, Skills, GitHub) */
  STANDARD: 21600,
  /** 24 hours (LLMs.txt, robots) */
  LONG: 86400,
  /** Dynamic API responses */
  NONE: 0
} as const

export const CACHE_HEADERS = {
  NO_STORE: { 'Cache-Control': 'no-store' },
  SEARCH: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
  FEED: { 'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=300' },
  LLMS: { 'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' }
} as const
