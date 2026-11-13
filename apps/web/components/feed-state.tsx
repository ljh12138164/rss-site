import { AlertCircle, Inbox } from 'lucide-react'

export function EmptyFeed() {
  return (
    <div className="rounded-sm border border-border bg-card py-12 text-center">
      <Inbox aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">暂无内容</p>
    </div>
  )
}

export function FeedError() {
  return (
    <div className="rounded-sm border border-border bg-card py-12 text-center" role="alert">
      <AlertCircle aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">暂时无法加载</p>
      <p className="mt-1.5 text-xs text-muted-foreground">请稍后刷新</p>
    </div>
  )
}
