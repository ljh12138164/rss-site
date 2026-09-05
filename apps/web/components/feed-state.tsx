import { AlertCircle, Inbox } from 'lucide-react'

export function EmptyFeed() {
  return (
    <div className="border-y border-border py-12 text-center">
      <Inbox aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-4 text-sm font-medium">暂无内容</p>
      <p className="mt-2 text-sm text-muted-foreground">这里还没有可显示的文章。</p>
    </div>
  )
}

export function FeedError() {
  return (
    <div className="border-y border-border py-12 text-center" role="alert">
      <AlertCircle aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-4 text-sm font-medium">暂时无法加载</p>
      <p className="mt-2 text-sm text-muted-foreground">请稍后再试。</p>
    </div>
  )
}
