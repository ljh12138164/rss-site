import { UiText } from './site-language'

export function FeedStatus({ itemCount }: { itemCount: number }) {
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      <UiText values={{ count: itemCount }}>{'{count} 条内容'}</UiText>
    </span>
  )
}
