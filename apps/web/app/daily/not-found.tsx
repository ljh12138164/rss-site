import Link from 'next/link'
import { SiteShell } from '../../components/site-shell'

export default function DailyNotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-xl rounded-sm border border-border bg-card p-8">
        <p className="font-mono text-xs text-primary">404</p>
        <h1 className="headline-display mt-2 text-2xl">该期日报不存在</h1>
        <Link
          href="/daily"
          className="mt-5 inline-flex min-h-10 items-center text-sm text-primary hover:underline"
        >
          返回最新日报 →
        </Link>
      </div>
    </SiteShell>
  )
}
