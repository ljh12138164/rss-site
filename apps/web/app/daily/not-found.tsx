import Link from 'next/link'
import { SiteShell } from '../../components/site-shell'

export default function DailyNotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl py-16">
        <p className="eyebrow mb-4 text-primary">404</p>
        <h1 className="headline-display text-3xl">这一期日报不存在</h1>
        <Link
          href="/daily"
          className="mt-6 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          阅读最新日报 →
        </Link>
      </div>
    </SiteShell>
  )
}
