import Link from 'next/link'
import { UiText } from '../../components/site-language'
import { SiteShell } from '../../components/site-shell'

export default function DailyNotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-xl rounded-sm border border-border bg-card p-8">
        <p className="font-mono text-xs text-primary">404</p>
        <h1 className="headline-display mt-2 text-2xl">
          <UiText>{'该期日报不存在'}</UiText>
        </h1>
        <Link
          href="/daily"
          className="mt-5 inline-flex min-h-10 items-center text-sm text-primary hover:underline"
        >
          <UiText>{'返回最新日报 →'}</UiText>
        </Link>
      </div>
    </SiteShell>
  )
}
