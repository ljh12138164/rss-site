import type { ReactNode } from 'react'
import { type SiteMessageKey, TranslatedText } from './site-language'
import { SiteShell } from './site-shell'

export function InformationPage({
  titleId,
  descriptionId,
  children
}: {
  titleId: SiteMessageKey
  descriptionId?: SiteMessageKey
  children: ReactNode
}) {
  return (
    <SiteShell mainClassName="mx-auto w-full max-w-3xl">
      <header className="mb-6 border-b border-border pb-6">
        <h1 className="headline-display text-3xl sm:text-4xl">
          <TranslatedText id={titleId} />
        </h1>
        {descriptionId && (
          <p className="mt-2.5 text-pretty text-sm leading-6 text-muted-foreground">
            <TranslatedText id={descriptionId} />
          </p>
        )}
      </header>
      <article className="space-y-8 rounded-sm border border-border bg-card p-6 sm:space-y-9 sm:p-8 [&_h2]:mb-2.5 [&_h2]:text-balance [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-pretty [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted-foreground [&_p+p]:mt-2.5">
        {children}
      </article>
    </SiteShell>
  )
}
