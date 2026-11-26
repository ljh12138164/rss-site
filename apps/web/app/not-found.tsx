import Link from 'next/link'
import { actionStyles } from '../components/action-styles'
import { TranslatedText } from '../components/site-language'
import { SiteShell } from '../components/site-shell'

export default function NotFound() {
  return (
    <SiteShell mainClassName="mx-auto flex w-full max-w-[42rem] items-center py-12 sm:py-20">
      <div className="w-full rounded-sm border border-border bg-card p-6 sm:p-8">
        <span className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
          404
        </span>
        <h1 className="headline-display mt-4 text-3xl sm:text-4xl">
          <TranslatedText id="errors.notFoundTitle" />
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          <TranslatedText id="errors.notFoundBody" />
        </p>
        <Link className={actionStyles('primary', 'default', 'mt-6')} href="/">
          <TranslatedText id="common.backHome" />
        </Link>
      </div>
    </SiteShell>
  )
}
