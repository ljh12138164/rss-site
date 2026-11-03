import { getHomeArticles } from './home-articles'
import { getSectionFeeds } from './hot-feed'
import { listCacheTargets } from './list-cache-scopes'

export async function warmListCaches(
  scopes = listCacheTargets().map((target) => target.scope),
  deadline?: AbortSignal
) {
  const targets = listCacheTargets().filter((target) => scopes.includes(target.scope))
  const failed: string[] = []
  let succeeded = 0
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(2, targets.length) }, async () => {
      while (next < targets.length) {
        const target = targets[next++]
        if (deadline?.aborted) {
          failed.push(target.scope)
          continue
        }
        try {
          if (target.filter) await getHomeArticles(null, undefined, target.filter, true)
          else await getSectionFeeds('skills', undefined, undefined, true)
          succeeded++
        } catch {
          failed.push(target.scope)
        }
      }
    })
  )
  return { total: targets.length, succeeded, failed }
}
