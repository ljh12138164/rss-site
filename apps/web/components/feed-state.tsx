import { AlertCircle, Inbox } from 'lucide-react'
import { UiText } from './site-language'

export function EmptyFeed() {
  return (
    <div className="rounded-sm border border-border bg-card py-12 text-center">
      <Inbox aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">
        <UiText>{'暂无内容'}</UiText>
      </p>
    </div>
  )
}

export function FeedError() {
  return (
    <div className="rounded-sm border border-border bg-card py-12 text-center" role="alert">
      <AlertCircle aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">
        <UiText>{'暂时无法加载'}</UiText>
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        <UiText>{'请稍后刷新'}</UiText>
      </p>
    </div>
  )
}
