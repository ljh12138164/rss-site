import { randomUUID } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { after } from 'next/server'
import { articleSource, createArticlePath } from './article-route'
import { publishContent } from './content-publication'
import { invalidateListCaches } from './list-cache'
import { warmListCaches } from './list-cache-prewarm'
import { affectedListScopes } from './list-cache-scopes'
import { type RevalidationScope, resolveRevalidation } from './revalidate-paths'

interface ContentUpdate extends RevalidationScope {
  publicationId?: string
  article?: { id: string; previousTitle: string; title: string }
}

export async function updateContent(scope: ContentUpdate) {
  const publicationId = scope.publicationId ?? randomUUID()
  const logFailure = (phase: 'revalidation' | 'publication' | 'listCache') =>
    console.info(
      JSON.stringify({
        publicationId,
        articleId: scope.article?.id,
        [phase]: 'failed',
        at: new Date().toISOString()
      })
    )
  try {
    const listScopes = affectedListScopes(scope)
    const cacheInvalidated = await invalidateListCaches(listScopes)
    if (!cacheInvalidated) logFailure('listCache')
    const { paths, dynamicPages, tags } = resolveRevalidation(scope)
    if (
      scope.article &&
      scope.source &&
      articleSource(scope.source) &&
      scope.source !== 'github' &&
      scope.section !== '/skills'
    ) {
      for (const title of [scope.article.previousTitle, scope.article.title]) {
        const path = createArticlePath(scope.source, title, scope.article.id)
        if (!paths.includes(path)) paths.push(path)
      }
    }
    const invalidatePages = () => {
      for (const tag of tags) revalidateTag(tag, { expire: 0 })
      for (const path of paths) revalidatePath(path)
      for (const path of dynamicPages) revalidatePath(path, 'page')
    }
    invalidatePages()
    after(async () => {
      try {
        if (listScopes.length && process.env.REDIS_URL) {
          let invalidated = cacheInvalidated
          let failed = listScopes
          for (let attempt = 0; attempt < 2; attempt++) {
            if (!invalidated) invalidated = await invalidateListCaches(listScopes)
            if (!invalidated) continue
            failed = (await warmListCaches(failed)).failed
            if (!failed.length) break
          }
          console.info(
            JSON.stringify({
              publicationId,
              listCache: failed.length ? 'failed' : 'succeeded',
              failed,
              at: new Date().toISOString()
            })
          )
          // Discard any page regenerated while the lists were being refreshed.
          invalidatePages()
        }
        await publishContent(paths, publicationId)
      } catch {
        logFailure('publication')
      }
    })
    return { paths, publicationId, cacheInvalidated }
  } catch (error) {
    logFailure('revalidation')
    throw error
  }
}
