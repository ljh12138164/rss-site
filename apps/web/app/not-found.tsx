import Link from 'next/link'
import { SiteShell } from '../components/site-shell'
import { Button } from '../components/ui/button'

export default function NotFound() {
  return (
    <SiteShell>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">404 / No signal</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">这里没有热点</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        回到首页，继续沿着已有的信号阅读。
      </p>
      <Button asChild className="mt-7" variant="outline">
        <Link href="/">返回首页</Link>
      </Button>
    </SiteShell>
  )
}
