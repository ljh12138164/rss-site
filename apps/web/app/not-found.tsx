import Link from 'next/link'
import { actionStyles } from '../components/action-styles'
import { SiteShell } from '../components/site-shell'

export default function NotFound() {
  return (
    <SiteShell>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">404 / No signal</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">这里没有热点</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">回到首页，继续浏览热点。</p>
      <Link className={actionStyles('outline', 'default', 'mt-7')} href="/">
        返回首页
      </Link>
    </SiteShell>
  )
}
