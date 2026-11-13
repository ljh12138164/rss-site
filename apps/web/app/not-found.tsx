import Link from 'next/link'
import { actionStyles } from '../components/action-styles'
import { SiteShell } from '../components/site-shell'

export default function NotFound() {
  return (
    <SiteShell mainClassName="mx-auto flex w-full max-w-2xl flex-col items-start py-12 sm:py-20">
      <div className="w-full rounded-sm border border-border bg-card p-6 sm:p-8">
        <span className="inline-flex items-center rounded-sm bg-primary/14 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
          404
        </span>
        <h1 className="headline-display mt-4 text-3xl sm:text-4xl">页面不存在</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          链接可能已失效，返回首页继续浏览热点。
        </p>
        <Link className={actionStyles('primary', 'default', 'mt-6')} href="/">
          返回首页
        </Link>
      </div>
    </SiteShell>
  )
}
