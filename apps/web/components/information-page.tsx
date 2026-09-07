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
      <header className="mb-8 border-l-4 border-primary pl-4 sm:mb-10">
        <h1 className="text-balance text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground">{description}</p>
      </header>
      <article className="space-y-8 rounded-xl border border-border bg-card p-5 sm:space-y-10 sm:p-8 [&_h2]:mb-3 [&_h2]:text-balance [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-pretty [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted-foreground [&_p+p]:mt-3">
        {children}
      </article>
    </SiteShell>
  )
}
