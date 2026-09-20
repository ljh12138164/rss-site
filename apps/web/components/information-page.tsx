import type { ReactNode } from 'react'
import { SiteShell } from './site-shell'

export function InformationPage({
  title,
  description,
  children
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <SiteShell mainClassName="mx-auto w-full max-w-3xl py-8 sm:py-12">
      <header className="mb-8 border-b border-strong pb-7 sm:mb-10">
        <h1 className="headline-display text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground">{description}</p>
      </header>
      <article className="space-y-8 border-y border-border py-8 sm:space-y-10 sm:py-10 [&_h2]:mb-3 [&_h2]:text-balance [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-pretty [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted-foreground [&_p+p]:mt-3">
        {children}
      </article>
    </SiteShell>
  )
}
