import { AlertCircle, Radio } from 'lucide-react'

export function EmptyFeed() {
  return (
    <div className="border-y border-border py-12 text-center">
      <Radio aria-hidden="true" className="mx-auto size-5 text-primary" />
      <p className="mt-4 text-sm font-medium">正在等待第一轮信号</p>
      <p className="mt-2 text-sm text-muted-foreground">采集完成后，热点会出现在这里。</p>
    </div>
  )
}

export function FeedError() {
  return (
    <div className="border-y border-border py-12 text-center" role="alert">
      <AlertCircle aria-hidden="true" className="mx-auto size-5 text-primary" />
      <p className="mt-4 text-sm font-medium">暂时无法读取热点</p>
      <p className="mt-2 text-sm text-muted-foreground">数据仍在 Supabase 中，请稍后刷新。</p>
    </div>
  )
}
