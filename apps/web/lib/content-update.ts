import { randomUUID } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { after } from 'next/server'
import { articleSource, createArticlePath } from './article-route'
import { publishContent } from './content-publication'
import { type RevalidationScope, resolveRevalidation } from './revalidate-paths'

interface ContentUpdate extends RevalidationScope {
  publicationId?: string
  article?: { id: string; previousTitle: string; title: string }
}

export function updateContent(scope: ContentUpdate) {
  const publicationId = scope.publicationId ?? randomUUID()
  const logFailure = (phase: 'revalidation' | 'publication') =>
    console.info(
      JSON.stringify({
        publicationId,
        articleId: scope.article?.id,
        [phase]: 'failed',
        at: new Date().toISOString()
      })
    )
  try {
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
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    for (const path of paths) revalidatePath(path)
    for (const path of dynamicPages) revalidatePath(path, 'page')
    after(async () => {
      try {
        await publishContent(paths, publicationId)
      } catch {
        logFailure('publication')
      }
    })
    return { paths, publicationId }
  } catch (error) {
    logFailure('revalidation')
    throw error
  }
}
