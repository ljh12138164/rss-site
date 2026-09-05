import { Bot, Radio } from 'lucide-react'
import { SiteShell } from '../../components/site-shell'

export default function AiLoading() {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <Bot aria-hidden="true" className="size-3.5" />
          AI event log / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          AI 最近发生了什么
        </h1>
      </header>

      <div className="border-y border-border py-12 text-center" role="status">
        <Radio aria-hidden="true" className="mx-auto size-5 text-primary" />
        <p className="mt-4 text-sm font-medium">正在读取真实事件</p>
        <p className="mt-2 text-sm text-muted-foreground">时间线会在 Supabase 返回数据后出现。</p>
      </div>
    </SiteShell>
  )
}
